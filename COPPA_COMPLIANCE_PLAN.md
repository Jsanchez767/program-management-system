# COPPA Compliance Implementation Plan

## 🚨 IMMEDIATE PRIORITY ACTIONS

### Phase 1: Age Verification & Consent (Week 1)

#### 1. Add Age Verification to Signup
```tsx
// Update signup form to include date of birth
const [dateOfBirth, setDateOfBirth] = useState("")

// Calculate age and determine if parental consent needed
const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Block signup for under-13 without parental consent
if (calculateAge(dateOfBirth) < 13) {
  // Redirect to parental consent flow
}
```

#### 2. Implement Parental Consent System
- Create parental consent form
- Email verification for parents
- Parental account creation
- Child account linking

#### 3. Data Collection Restrictions
- Limit data collection for under-13 users
- Remove optional fields for children
- Implement "minimal data" profiles

### Phase 2: Privacy & Legal (Week 2)

#### 1. Privacy Policy Creation
```typescript
// Add privacy policy types
export interface PrivacySettings {
  hasParentalConsent: boolean
  dataCollectionLevel: 'minimal' | 'standard' | 'full'
  marketingOptIn: boolean
  thirdPartySharing: boolean
  age: number
  consentDate: string
}
```

#### 2. Data Handling Updates
- Implement data retention limits for children
- Add data deletion mechanisms
- Create parental data access portal

### Phase 3: Technical Implementation (Week 3)

#### 1. Database Schema Updates
```sql
-- Add age verification and consent tracking
ALTER TABLE auth.users ADD COLUMN date_of_birth DATE;
ALTER TABLE auth.users ADD COLUMN requires_parental_consent BOOLEAN DEFAULT false;
ALTER TABLE auth.users ADD COLUMN parental_consent_given BOOLEAN DEFAULT false;
ALTER TABLE auth.users ADD COLUMN parental_email TEXT;
ALTER TABLE auth.users ADD COLUMN consent_date TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN data_collection_level TEXT DEFAULT 'standard';

-- Create parental consent tracking table
CREATE TABLE parental_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_user_id UUID REFERENCES auth.users(id),
    parent_email TEXT NOT NULL,
    consent_token TEXT UNIQUE NOT NULL,
    consent_given BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
```

#### 2. Component Updates
```tsx
// Update participant types for COPPA compliance
export interface Participant {
  id: string
  first_name: string
  last_name: string
  email: string
  date_of_birth: string // NEW: Required for age verification
  requires_parental_consent: boolean // NEW
  parental_consent_given: boolean // NEW
  parental_email?: string // NEW
  data_collection_level: 'minimal' | 'standard' | 'full' // NEW
  // Existing fields...
}

// Conditional data collection based on age
export interface ChildSafeParticipant {
  id: string
  first_name: string
  last_name: string
  // NO email, phone, or detailed personal info for under-13
}
```

## 🛡️ COPPA Compliance Features to Add

### 1. Age-Gated Registration
```tsx
// Age verification component
function AgeVerification({ onVerified }: { onVerified: (age: number) => void }) {
  const [dateOfBirth, setDateOfBirth] = useState("")
  
  const handleVerify = () => {
    const age = calculateAge(dateOfBirth)
    if (age < 13) {
      // Redirect to parental consent flow
      router.push('/auth/parental-consent')
    } else {
      onVerified(age)
    }
  }
  
  return (
    <div className="age-verification">
      <h2>Age Verification Required</h2>
      <p>Please enter your date of birth to continue.</p>
      <input
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        required
      />
      <button onClick={handleVerify}>Verify Age</button>
    </div>
  )
}
```

### 2. Parental Consent Portal
```tsx
function ParentalConsentPortal() {
  return (
    <div className="parental-consent">
      <h1>Parental Consent Required</h1>
      <p>Your child is under 13 years old. Federal law requires parental consent before we can collect their information.</p>
      
      <div className="consent-form">
        <h3>What information we collect:</h3>
        <ul>
          <li>Name (for program enrollment)</li>
          <li>Emergency contact (for safety)</li>
          <li>Medical information (if relevant to program)</li>
        </ul>
        
        <h3>What we DON'T collect for children:</h3>
        <ul>
          <li>Email addresses</li>
          <li>Phone numbers</li>
          <li>Photos (without explicit permission)</li>
          <li>Social information</li>
        </ul>
        
        <ConsentForm />
      </div>
    </div>
  )
}
```

### 3. Data Access Controls
```tsx
// Restrict data access for children
function useChildSafeData(userId: string) {
  const { user } = useUser()
  const isChild = user?.user_metadata?.requires_parental_consent
  
  // Return limited data for children
  if (isChild) {
    return useChildSafeParticipantData(userId)
  }
  
  return useFullParticipantData(userId)
}
```

## 📋 Compliance Checklist

### ✅ Required Implementation Steps

#### Legal Requirements
- [ ] Add Privacy Policy specifically addressing children
- [ ] Create Terms of Service with COPPA section
- [ ] Implement "Notice to Parents" document
- [ ] Add data retention policy for children

#### Technical Requirements
- [ ] Age verification on all registration flows
- [ ] Parental consent collection system
- [ ] Data minimization for under-13 users
- [ ] Secure parental verification process
- [ ] Data deletion mechanisms
- [ ] Audit logging for child data access

#### Operational Requirements
- [ ] Staff training on COPPA compliance
- [ ] Regular compliance audits
- [ ] Incident response procedures
- [ ] Data breach notification procedures

### 🚨 High-Risk Areas to Address

1. **Document Upload System**: Currently allows children to upload personal documents
2. **Photo Release Forms**: No age-appropriate consent process
3. **Communication Features**: May enable direct communication with children
4. **Analytics**: @vercel/analytics may track children without consent

## ⏰ Implementation Timeline

### Week 1: Critical Foundation
- Add age verification to signup
- Block under-13 registration without consent
- Create basic parental consent form

### Week 2: Legal Framework
- Draft privacy policy
- Create parental notification system
- Implement data collection restrictions

### Week 3: Technical Implementation
- Update database schema
- Implement consent tracking
- Add data access controls

### Week 4: Testing & Deployment
- Test all consent flows
- Legal review
- Deploy with monitoring

## 💰 Estimated Implementation Cost

- **Legal consultation**: $3,000-5,000
- **Development time**: 40-60 hours
- **Ongoing compliance**: $1,000-2,000/year
- **Potential fines if non-compliant**: $43,280 per violation

## 🎯 Recommendation

**DO NOT LAUNCH WITHOUT COPPA COMPLIANCE** - The FTC takes COPPA violations very seriously, with fines up to $43,280 per child affected. Educational platforms are high-priority targets for enforcement.

Start with the age verification system immediately, as this is the foundation for all other COPPA requirements.