# Sample Inputs and Outputs

This document provides a concrete example of the data flow in the AI Talent Scout agent.

## Input

### 1. Job Description (JD)
```text
We are looking for a Senior Full Stack Developer with 5+ years of experience.
Must have strong expertise in React, Node.js, and C#. Experience with Azure or AWS is a plus.
The candidate should be based in Bengaluru and open to a compensation around ₹24,00,000.
```

### 2. Candidate Profiles (Database Mock)
```json
[
  {
    "id": "c1",
    "name": "Arjun Mehta",
    "role": "Senior Full Stack Developer",
    "experienceYears": 6,
    "skills": ["React", "Node.js", "TypeScript", "C#", "SQL", "Azure"],
    "location": "Bengaluru, India",
    "expectedSalary": "₹25,00,000"
  },
  {
    "id": "c2",
    "name": "Sanya Iyer",
    "role": "Backend Engineer",
    "experienceYears": 3,
    "skills": ["Java", "Spring Boot", "MySQL", "AWS"],
    "location": "Pune, India",
    "expectedSalary": "₹18,00,000"
  }
]
```

## AI Processing Outputs

### 1. Match Scoring (Candidate Discovery)
The AI evaluates the candidates against the JD and outputs the following Match Scores and Explainability:

**Arjun Mehta**
- **Match Score**: 95%
- **Explainability**: Perfect match on core skills (React, Node.js, C#, Azure), experience level, and location.

**Sanya Iyer**
- **Match Score**: 40%
- **Explainability**: Lacks core requirements like React/C#, and has fewer years of experience than requested.

### 2. Conversational Engagement (Simulated Outreach)
When the recruiter clicks "Engage AI" for Arjun Mehta, the system simulates the following transcript:

**Transcript:**
1. **AI Agent**: Hi Arjun Mehta, I came across your impressive background. We have a Senior Full Stack Developer position that aligns perfectly with your skills. Are you currently open to new opportunities?
2. **Arjun Mehta**: Hello! Yes, I am actively looking and the role sounds interesting.
3. **AI Agent**: Great! The role offers up to ₹24,00,000 and is based in Bengaluru. Does this align with your expectations, and are you comfortable with the location requirements?
4. **Arjun Mehta**: Yes, the compensation is very close to what I'm looking for. I am already based in Bengaluru and ready to start.

**Engagement Result:**
- **Interest Score**: 90%
- **Summary**: Arjun is highly interested, based in the required location, and comfortable with the compensation range.
