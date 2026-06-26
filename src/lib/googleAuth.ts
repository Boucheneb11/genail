import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Read cached token from localStorage safely for session persistence across refreshes
// Note: The skill recommends in-memory caching, but we can store it in memory,
// and since some browser flows might reload or we want a smooth admin experience,
// we'll keep it primarily in memory and clear on logout.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have a cached token in memory, use it
  const savedToken = sessionStorage.getItem('g_sheets_token');
  if (savedToken) {
    cachedAccessToken = savedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('g_sheets_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('g_sheets_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('g_sheets_token');
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('g_sheets_token');
  }
  return cachedAccessToken;
};

// --- Google Sheets API Functions ---

export interface SheetRowValues {
  name: string;
  phone: string;
  age: string;
  hadFever: string;
  city: string;
  date: string;
}

/**
 * Creates a new Google Spreadsheet with custom headers for children leads.
 */
export const createGoogleSheet = async (accessToken: string, title: string): Promise<string> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize the sheet with headers
  await appendLeadRows(accessToken, spreadsheetId, [
    ['الاسم بالكامل', 'رقم الهاتف', 'الفئة العمرية للطفل', 'هل أصيب بالحمى سابقاً؟', 'الولاية/المدينة', 'تاريخ التسجيل']
  ]);

  return spreadsheetId;
};

/**
 * Appends rows to a Google Spreadsheet.
 */
export const appendLeadRows = async (
  accessToken: string,
  spreadsheetId: string,
  rows: string[][]
): Promise<void> => {
  const range = 'Sheet1!A1';
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append rows to spreadsheet: ${errText}`);
  }
};

/**
 * Verifies if a spreadsheet exists and is accessible.
 */
export const checkSpreadsheetExists = async (accessToken: string, spreadsheetId: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Fetches row values from a Google Spreadsheet and maps them to Lead structures.
 */
export const fetchSpreadsheetRows = async (accessToken: string, spreadsheetId: string): Promise<any[]> => {
  const range = 'Sheet1!A2:F';
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch spreadsheet rows: ${errText}`);
  }

  const data = await response.json();
  const values: string[][] = data.values || [];

  const reverseAgeMap: Record<string, string> = {
    'أقل من 6 أشهر': 'less-than-6m',
    '6-12 شهراً': '6-12m',
    '1-3 سنوات': '1-3y',
    'أكثر من 3 سنوات': 'more-than-3y',
    'less-than-6m': 'less-than-6m',
    '6-12m': '6-12m',
    '1-3y': '1-3y',
    'more-than-3y': 'more-than-3y'
  };

  const reverseFeverMap: Record<string, string> = {
    'نعم': 'yes',
    'لا': 'no',
    'غير متأكد': 'not-sure',
    'yes': 'yes',
    'no': 'no',
    'not-sure': 'not-sure'
  };

  return values.map((row, idx) => {
    const parentName = row[0] || '';
    const phoneNumber = row[1] || '';
    const childAgeText = row[2] || '6-12m';
    const hadFeverText = row[3] || 'no';
    const city = row[4] || '';
    const dateText = row[5] || '';

    // Reverse maps
    const childAge = reverseAgeMap[childAgeText.trim()] || '6-12m';
    const hadFeverBefore = reverseFeverMap[hadFeverText.trim()] || 'no';

    // Parse date if possible, else fallback to now
    let createdAt = new Date().toISOString();
    if (dateText) {
      try {
        // Replace non-standard spaces or clean Arabic characters before parsing if needed,
        // or just use Date.parse / new Date since ISO dates or typical formats are parseable.
        const cleanedDateText = dateText.replace(/م/g, 'PM').replace(/ص/g, 'AM');
        const parsed = Date.parse(cleanedDateText);
        if (!isNaN(parsed)) {
          createdAt = new Date(parsed).toISOString();
        } else {
          // If custom format, try checking if it contains standard separators or just keep it
          createdAt = new Date().toISOString();
        }
      } catch {
        // Fallback
      }
    }

    return {
      id: `gsheet_${idx}_${Date.now()}`,
      parentName,
      phoneNumber,
      childAge,
      hadFeverBefore,
      city,
      createdAt
    };
  });
};

