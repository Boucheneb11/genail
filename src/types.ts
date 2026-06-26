/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lead {
  id: string;
  parentName: string;
  phoneNumber: string;
  childAge: 'less-than-6m' | '6-12m' | '1-3y' | 'more-than-3y';
  hadFeverBefore: 'yes' | 'no' | 'not-sure';
  city: string;
  createdAt: string;
}

export interface SymptomOption {
  id: string;
  label: string;
  isCritical: boolean;
  description: string;
}

export interface VideoSlide {
  id: string;
  title: string;
  description: string;
  alertText: string;
  bgGradient: string;
  youtubeId?: string;
}

export type RiskLevel = 'normal' | 'mild' | 'moderate' | 'high' | 'critical';

export interface RiskAssessmentResult {
  level: RiskLevel;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: string;
  summary: string;
  instructions: string[];
}
