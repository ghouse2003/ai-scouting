import { useState } from 'react';
import { Bot, Sparkles, Search, MessageSquare, X, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';
import { mockCandidates, Candidate } from './data/mockCandidates';
import { matchCandidates, simulateChat, EngagementResult, AIResult } from './services/aiService';

export default function App() {
  const [jd, setJd] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rankedCandidates, setRankedCandidates] = useState<(Candidate & AIResult)[] | null>(null);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<(Candidate & AIResult) | null>(null);
  const [chatResult, setChatResult] = useState<EngagementResult | null>(null);
  const [isChatting, setIsChatting] = useState(false);

  const handleScout = async () => {
    if (!jd.trim()) return;
    setIsProcessing(true);
    try {
      const results = await matchCandidates(jd, mockCandidates);
      setRankedCandidates(results);
    } catch (e) {
      console.error(e);
      alert('Error connecting to AI service.');
    }
    setIsProcessing(false);
  };

  const handleEngage = async (candidate: Candidate & AIResult) => {
    setSelectedCandidate(candidate);
    setDrawerOpen(true);
    setIsChatting(true);
    setChatResult(null);
    try {
      const result = await simulateChat(candidate, jd);
      setChatResult(result);
    } catch (e) {
      console.error(e);
    }
    setIsChatting(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedCandidate(null);
      setChatResult(null);
    }, 300); // Wait for animation
  };

  return (
    <div className="container">
      
      <header className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#eef2ff] text-[#4f46e5] mb-4">
          <Bot size={28} />
        </div>
        <h1 className="text-3xl mb-3">AI Talent Scout</h1>
        <p className="text-gray-500 text-sm">
          Discover top matches instantly and engage them with conversational AI to assess genuine interest.
        </p>
      </header>

      {/* Top Section: JD Input */}
      <div className="card p-6 mb-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg flex items-center gap-2">
            <Briefcase size={20} className="text-[#4f46e5]" /> Define the Role
          </h2>
        </div>
        <textarea 
          className="input-field mb-4"
          rows={4}
          placeholder="Paste Job Description here (e.g. Senior Full Stack Engineer, 5+ years React/Node...)"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <div className="flex justify-end">
          <button 
            className="btn btn-primary"
            onClick={handleScout}
            disabled={isProcessing || !jd.trim()}
          >
            {isProcessing ? 'Analyzing Candidates...' : <><Search size={18}/> Scout Database</>}
          </button>
        </div>
      </div>

      {/* Bottom Section: Ranked Candidates */}
      {rankedCandidates && (
        <div className="max-w-4xl mx-auto animate-slide-up">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            Discovery Results <span className="badge">{rankedCandidates.length} Found</span>
          </h3>
          
          <div className="flex flex-col gap-4">
            {rankedCandidates.map((candidate, idx) => (
              <div key={candidate.id} className="card hoverable p-5 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{animationDelay: `${idx * 0.1}s`}}>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg">{candidate.name}</h4>
                    {idx === 0 && <span className="badge badge-success text-[10px]">Top Match</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{candidate.role} • {candidate.experienceYears}y exp • {candidate.location}</p>
                  
                  {/* Explainability */}
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg text-sm text-gray-600 flex items-start gap-2">
                    <Sparkles size={16} className="text-[#4f46e5] mt-0.5 shrink-0" />
                    <span>{candidate.explainability}</span>
                  </div>
                </div>

                {/* Score & Action */}
                <div className="flex md:flex-col items-center gap-4 md:min-w-[140px] md:border-l border-gray-100 md:pl-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#10b981] leading-none mb-1">{candidate.matchScore}%</div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Match Score</div>
                  </div>
                  
                  <button 
                    className="btn btn-secondary w-full text-sm"
                    onClick={() => handleEngage(candidate)}
                  >
                    <MessageSquare size={16} /> Engage AI
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Drawer for Chat */}
      {drawerOpen && selectedCandidate && (
        <>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="drawer">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Bot size={20} className="text-[#4f46e5]"/> AI Outreach
                </h3>
                <p className="text-sm text-gray-500">Engaging {selectedCandidate.name}</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-800 transition-colors p-2">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body - Chat */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
              {isChatting ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-12 h-12 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Agent is conversing...</p>
                  <p className="text-sm text-gray-500">Analyzing salary, location, and role expectations.</p>
                </div>
              ) : chatResult ? (
                <div className="flex flex-col gap-4">
                  {chatResult.transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`chat-bubble ${msg.role}`}>
                        <div className="text-[10px] uppercase font-bold mb-1 opacity-70">
                          {msg.role === 'agent' ? 'AI Agent' : selectedCandidate.name}
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Drawer Footer - Result */}
            {chatResult && !isChatting && (
              <div className="p-6 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interest Assessed</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#4f46e5]">{chatResult.interestScore}%</span>
                  </div>
                </div>
                <div className="bg-[#eef2ff] text-[#4338ca] p-3 rounded-lg text-sm flex gap-2">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <p>{chatResult.summary}</p>
                </div>
                <button className="btn btn-primary w-full mt-6" onClick={closeDrawer}>
                  Done <ChevronRight size={16}/>
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
