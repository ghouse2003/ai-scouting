export interface Candidate {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  skills: string[];
  location: string;
  expectedSalary: string;
  summary: string;
}

export const mockCandidates: Candidate[] = [
  {
    id: "c1",
    name: "Arjun Mehta",
    role: "Senior Full Stack Developer",
    experienceYears: 6,
    skills: ["React", "Node.js", "TypeScript", "C#", "SQL", "Azure"],
    location: "Bengaluru, India",
    expectedSalary: "₹25,00,000",
    summary: "Experienced developer with a strong background in C# backend and React frontend. Successfully led cloud migrations and built scalable APIs."
  },
  {
    id: "c2",
    name: "Sanya Iyer",
    role: "Backend Engineer",
    experienceYears: 3,
    skills: ["Java", "Spring Boot", "MySQL", "AWS"],
    location: "Pune, India",
    expectedSalary: "₹18,00,000",
    summary: "Solid backend engineer specializing in Java/Spring ecosystems. Eager to learn new technologies and scale microservices."
  },
  {
    id: "c3",
    name: "Rahul Sharma",
    role: "Software Engineer II",
    experienceYears: 5,
    skills: ["C#", ".NET Core", "SQL Server", "React"],
    location: "Hyderabad, India",
    expectedSalary: "₹22,00,000",
    summary: "5 years of building robust .NET applications. Deep expertise in SQL performance tuning and entity framework."
  },
  {
    id: "c4",
    name: "Priya Patel",
    role: "Frontend Developer",
    experienceYears: 4,
    skills: ["Vue.js", "JavaScript", "HTML", "CSS", "UI/UX"],
    location: "Remote",
    expectedSalary: "₹15,00,000",
    summary: "Creative frontend developer passionate about accessible and beautiful user interfaces."
  },
  {
    id: "c5",
    name: "Karan Singh",
    role: "Lead Cloud Architect",
    experienceYears: 10,
    skills: ["AWS", "Kubernetes", "Python", "Go", "Terraform"],
    location: "Mumbai, India",
    expectedSalary: "₹45,00,000",
    summary: "Cloud architect with extensive experience designing highly available systems and leading large engineering teams."
  }
];
