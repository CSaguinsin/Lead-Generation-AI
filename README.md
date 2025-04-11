# Lead Generator AI

A modern lead generation platform built with Next.js, Supabase, and Gemini AI, inspired by tools like Apollo.io and Hunter.io.

## Overview

Lead Generator AI helps sales teams and marketers discover and enrich business contacts by finding email addresses, gathering company information, and organizing leads. The platform combines public data sources, verification APIs, and AI to deliver accurate and actionable lead data.

## Tech Stack

- **Frontend & Backend**: [Next.js](https://nextjs.org/) (React framework)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Authentication)
- **AI Component**: [Google Gemini AI](https://ai.google.dev/)
- **External APIs**: 
  - Email Discovery: Hunter.io [Hunter.io](https://hunter.io/)
  - Email Verification: Abstract API [Abstract API](https://www.abstractapi.com/)
  - Company Data: People Data Labs (PDL) [People Data Labs](https://peopledatalabs.com/)
  - LinkedIn Data: Proxycurl (optional) [Proxycurl](https://proxycurl.io/)

## Features

- ✉️ **Email Discovery**: Find professional email addresses based on names and companies
- 🔍 **Email Verification**: Validate email deliverability and reduce bounce rates
- 🏢 **Company Data**: Gather intelligence on companies and organizational structure
- 👥 **Contact Enrichment**: Add valuable data to your existing contacts
- 📋 **Lead Management**: Search, filter, and organize leads into lists
- 📊 **Usage Analytics**: Track API usage and lead generation metrics
- 💰 **Subscription Tiers**: Free and premium access levels

## Project Structure

```
lead-generator-ai/
├── public/
├── src/
│   ├── app/                 # App router pages
│   │   ├── dashboard/       # Dashboard and main app screens
│   │   ├── auth/            # Authentication pages
│   │   └── api/             # API routes 
│   │       ├── email/       # Email discovery endpoints
│   │       ├── company/     # Company data endpoints
│   │       └── leads/       # Lead management endpoints
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Basic UI components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── leads/           # Lead management components
│   │   └── search/          # Search components
│   ├── lib/                 # Utility functions
│   │   ├── api/             # API integrations
│   │   │   ├── hunter.js    # Hunter.io API wrapper
│   │   │   ├── abstract.js  # Abstract API wrapper
│   │   │   ├── pdl.js       # People Data Labs wrapper
│   │   │   └── proxycurl.js # Proxycurl API wrapper
│   │   ├── db/              # Supabase client & queries
│   │   ├── ai/              # Gemini AI integration
│   │   └── utils/           # Helper functions
│   ├── hooks/               # Custom React hooks
│   └── styles/              # Global styles
├── public/                  # Static assets
├── supabase/                # Supabase configuration
├── .env.local.example       # Environment variables template
├── next.config.js           # Next.js configuration
└── package.json             # Dependencies
```

## API Integrations

### 1. Hunter.io (Email Discovery)
- **Purpose**: Find email addresses and patterns for companies
- **Free Tier**: 25 searches/month
- **Setup**: [Hunter.io API Documentation](https://hunter.io/api-documentation)
- **Implementation**: Use to find email addresses based on name + company

```javascript
// Example Hunter.io implementation
async function findEmail(firstName, lastName, domain) {
  const response = await axios.get('https://api.hunter.io/v2/email-finder', {
    params: {
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: process.env.HUNTER_API_KEY
    }
  });
  
  return response.data.data;
}
```

### 2. Abstract API (Email Verification)
- **Purpose**: Verify email deliverability and quality
- **Free Tier**: 100 verifications/month
- **Setup**: [Abstract API Documentation](https://www.abstractapi.com/email-verification-validation-api)
- **Implementation**: Validate emails discovered through Hunter.io

```javascript
// Example Abstract API implementation
async function verifyEmail(email) {
  const response = await axios.get('https://emailvalidation.abstractapi.com/v1/', {
    params: {
      api_key: process.env.ABSTRACT_API_KEY,
      email
    }
  });
  
  return {
    deliverable: response.data.deliverability === "DELIVERABLE",
    quality_score: response.data.quality_score,
    is_valid_format: response.data.is_valid_format.value
  };
}
```

### 3. People Data Labs (Company Data)
- **Purpose**: Enrich with company information
- **Pricing**: Pay-as-you-go or subscription options
- **Setup**: [PDL API Documentation](https://docs.peopledatalabs.com/docs/company-api)
- **Implementation**: Get company details from domain

```javascript
// Example PDL implementation
async function getCompanyData(domain) {
  const response = await axios.get('https://api.peopledatalabs.com/v5/company/enrich', {
    params: {
      website: domain
    },
    headers: {
      'X-Api-Key': process.env.PDL_API_KEY
    }
  });
  
  return response.data;
}
```

### 4. Proxycurl (LinkedIn Data - Optional)
- **Purpose**: Extract LinkedIn profile and company data
- **Pricing**: Pay-per-credit system
- **Setup**: [Proxycurl API Documentation](https://nubela.co/proxycurl/docs)
- **Implementation**: Get LinkedIn profile data

```javascript
// Example Proxycurl implementation
async function getLinkedInProfile(profileUrl) {
  const response = await axios.get('https://nubela.co/proxycurl/api/v2/linkedin', {
    params: {
      url: profileUrl,
      use_cache: 'if-present'
    },
    headers: {
      Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}`
    }
  });
  
  return response.data;
}
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- API keys for:
  - Hunter.io (free tier)
  - Abstract API Email Validation (free tier)
  - People Data Labs
  - Google Gemini AI
  - Proxycurl (optional)

### Setup Instructions

1. **Clone repository and install dependencies**

```bash
git clone https://github.com/yourusername/lead-generator-ai.git
cd lead-generator-ai
npm install
```

2. **Set up environment variables**

Create a `.env.local` file using the example template:

```bash
cp .env.local.example .env.local
```

Fill in the required API keys and configuration:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys
HUNTER_API_KEY=your-hunter-api-key
ABSTRACT_API_KEY=your-abstract-api-key
PDL_API_KEY=your-pdl-api-key
PROXYCURL_API_KEY=your-proxycurl-api-key
GEMINI_API_KEY=your-gemini-api-key

# Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Initialize Supabase**

```bash
npx supabase init
```

4. **Run the development server**

```bash
npm run dev
```

5. **Access the application**

Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

Run the following SQL in your Supabase SQL editor to set up the required tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  api_key TEXT UNIQUE,
  usage_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  email_verification_status TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  source TEXT,
  confidence_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,
  name TEXT,
  industry TEXT[],
  size_range TEXT,
  employee_count INTEGER,
  location TEXT,
  founded_year INTEGER,
  description TEXT,
  website TEXT,
  linkedin_url TEXT,
  discovered_email_pattern TEXT[],
  last_enriched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List_Leads junction table
CREATE TABLE list_leads (
  list_id UUID REFERENCES lists NOT NULL,
  lead_id UUID REFERENCES leads NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (list_id, lead_id)
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users NOT NULL,
  action_type TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development Roadmap

### Phase 1: Foundation (Weeks 1-3)
- Set up Next.js project with TypeScript
- Configure Supabase authentication
- Create database tables
- Build basic UI components
- Set up API key management

### Phase 2: Core API Integration (Weeks 4-6)
- Implement Hunter.io for email discovery
- Add Abstract API for email verification
- Integrate People Data Labs for company data
- Create unified API response caching

### Phase 3: Lead Management (Weeks 7-9)
- Build lead search and filtering
- Create list management UI
- Implement lead exports
- Add basic analytics

### Phase 4: AI Enhancement (Weeks 10-12)
- Integrate Gemini AI for lead scoring
- Add email pattern prediction
- Implement lead quality estimation
- Create outreach suggestion engine

### Phase 5: Billing & User Management (Weeks 13-15)
- Add subscription tiers with Stripe
- Implement usage limits
- Create admin dashboard
- Set up user roles and permissions

## API Usage Optimization

### Cost Management
- Cache all API responses in Supabase
- Implement tiered enrichment (basic data for free users, deep for paid)
- Use batch processing for bulk operations
- Set up rate limiting and proper error handling

### Free Tier Strategy
- Hunter.io: 25 searches/month
- Abstract API: 100 verifications/month
- PDL: Pay-as-you-go initially
- Set up usage tracking to manage limits

## Key Features Implementation

### Email Pattern Discovery
1. Use Hunter.io to find email patterns for a company domain
2. Cache patterns in the companies table
3. Use Gemini AI to predict likely patterns for new companies

### Lead Enrichment
1. Start with basic contact info (name, company)
2. Generate and verify email address
3. Enhance with company data
4. Add LinkedIn profile info (if available)
5. Calculate confidence score

### Search & Filtering
1. Implement company search by domain or name
2. Create person search by name or title
3. Add advanced filters (industry, size, location)
4. Save common searches as templates

## Gemini AI Integration

### Implementation Areas
- **Email Pattern Prediction**: Predict likely email formats based on known examples
- **Lead Scoring**: Rank leads based on fit criteria
- **Data Cleansing**: Normalize and clean user inputs
- **Personalized Outreach**: Generate tailored message templates

Example Gemini implementation:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function predictEmailPattern(domain, knownPatterns = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `
  I need to predict the most likely email pattern for ${domain}.
  ${knownPatterns.length > 0 ? `Known patterns: ${knownPatterns.join(", ")}` : "No confirmed patterns yet."}
  
  Return only the top 3 patterns in JSON format: ["pattern1", "pattern2", "pattern3"]
  `;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    // Extract JSON array from response
    const patternMatch = text.match(/\[(.*)\]/s);
    if (patternMatch) {
      return JSON.parse(patternMatch[0]);
    }
    return ["first.last@domain.com", "firstl@domain.com", "first@domain.com"];
  } catch (error) {
    console.error('AI pattern prediction failed:', error);
    return ["first.last@domain.com", "firstl@domain.com", "first@domain.com"];
  }
}
```

## Best Practices

### Rate Limiting
- Implement per-user rate limits based on tier
- Add retry logic with exponential backoff
- Set up queue for batch processing

### Data Storage
- Use row-level security in Supabase
- Encrypt sensitive user data
- Implement proper data retention policies

### Error Handling
- Create fallback APIs for critical functions
- Log all API errors with context
- Show appropriate user feedback

## Deployment

### Recommended Platforms
- Vercel for Next.js frontend and API routes
- Supabase for database and authentication
- GitHub Actions for CI/CD

### Deployment Steps
1. Connect repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Configure build settings
4. Deploy with `git push`

## Resources & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Hunter.io API Documentation](https://hunter.io/api-documentation/v2)
- [Abstract API Documentation](https://www.abstractapi.com/api/email-verification-validation-api)
- [People Data Labs Documentation](https://docs.peopledatalabs.com/)
- [Gemini AI Documentation](https://ai.google.dev/docs)
- [Proxycurl Documentation](https://nubela.co/proxycurl/docs) (Optional)

## Troubleshooting

**API Rate Limiting Issues**
- Check your current usage in the provider dashboard
- Implement proper caching
- Set up fallback sources

**Email Discovery Failures**
- Verify the domain exists and has mail servers
- Try alternative email patterns
- Use Gemini AI for pattern prediction

**Database Performance**
- Set up proper indexes
- Implement pagination for large results
- Use efficient query patterns

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.