import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function SentimentMeter({ score, type }) {
  const color = type === 'positive' ? 'bg-green-500' : 'bg-red-500'
  const pct = Math.round(score * 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize text-white/60">{type}</span>
        <span className="font-bold text-white">{pct}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function HistoryItem({ item, index }) {
  const isPos = item.sentiment === 'POSITIVE'
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
      <span className={`text-xl`}>{isPos ? '😊' : '😞'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{item.text}</p>
        <p className={`text-xs font-semibold mt-0.5 ${isPos ? 'text-green-400' : 'text-red-400'}`}>
          {item.sentiment} · {Math.round(item.confidence * 100)}% confidence
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [batchText, setBatchText] = useState('')
  const [batchResults, setBatchResults] = useState(null)
  const [activeTab, setActiveTab] = useState('single')

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await axios.post(`${API_URL}/predict`, { text })
      setResult(res.data)
      setHistory(prev => [res.data, ...prev].slice(0, 10))
    } catch (err) {
      setError('Failed to connect to API. Make sure the backend is running!')
    } finally {
      setLoading(false)
    }
  }

  const analyzeBatch = async () => {
    if (!batchText.trim()) return
    setLoading(true)
    setBatchResults(null)
    try {
      const texts = batchText.split('\n').filter(t => t.trim())
      const res = await axios.post(`${API_URL}/predict/batch`, { texts })
      setBatchResults(res.data.results)
    } catch (err) {
      setError('Batch analysis failed!')
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    "This product is absolutely amazing! Best purchase I've ever made.",
    "Terrible experience. Complete waste of money. Never again.",
    "The movie was okay, not great but not terrible either.",
    "I absolutely love this! It exceeded all my expectations!",
    "Very disappointed with the quality. Would not recommend."
  ]

  const isPositive = result?.sentiment === 'POSITIVE'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-2xl shadow-indigo-500/40">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SentimentAI</h1>
          <p className="text-white/40 text-sm">Powered by Machine Learning · Logistic Regression · 81.5% Accuracy</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">API Online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-8">
          {['single', 'batch', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl font-semibold text-sm transition capitalize ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab === 'single' ? '🎯 Single' : tab === 'batch' ? '📦 Batch' : `📜 History (${history.length})`}
            </button>
          ))}
        </div>

        {/* Single Analysis Tab */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>✍️</span> Enter Text to Analyze
              </h2>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type or paste any text here — a review, tweet, comment, or anything..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-2 mb-4">
                <span className="text-white/20 text-xs">{text.length} characters</span>
                <button
                  onClick={() => setText('')}
                  className="text-white/20 hover:text-white/50 text-xs transition"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <> 🔍 Analyze Sentiment </>
                )}
              </button>

              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Example texts */}
              <div className="mt-4">
                <p className="text-white/30 text-xs mb-2">Try an example:</p>
                <div className="space-y-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setText(ex)}
                      className="w-full text-left text-xs text-white/40 hover:text-white/70 bg-white/3 hover:bg-white/5 border border-white/5 rounded-lg px-3 py-2 transition truncate"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📊</span> Analysis Result
              </h2>
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <span className="text-5xl mb-3">🎭</span>
                  <p className="text-sm">Enter text and click Analyze</p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
                  <p className="text-white/40 text-sm">Analyzing sentiment...</p>
                </div>
              )}
              {result && !loading && (
                <div>
                  {/* Big sentiment display */}
                  <div className={`rounded-2xl p-6 mb-4 text-center border ${
                    isPositive
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="text-6xl mb-2">{isPositive ? '😊' : '😞'}</div>
                    <div className={`text-3xl font-bold mb-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {result.sentiment}
                    </div>
                    <div className="text-white/40 text-sm">
                      {Math.round(result.confidence * 100)}% confident
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="mb-4">
                    <SentimentMeter score={result.scores.positive} type="positive" />
                    <SentimentMeter score={result.scores.negative} type="negative" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                      <div className="text-white font-bold">{result.processing_time_ms}ms</div>
                      <div className="text-white/30 text-xs">Processing Time</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                      <div className="text-white font-bold">{result.text.split(' ').length}</div>
                      <div className="text-white/30 text-xs">Words Analyzed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Tab */}
        {activeTab === 'batch' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span>📦</span> Batch Analysis
              </h2>
              <p className="text-white/30 text-xs mb-4">Enter one text per line — analyze up to 10 at once</p>
              <textarea
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder={`This product is amazing!\nTerrible experience, never again.\nIt was okay I guess.`}
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none text-sm"
              />
              <button
                onClick={analyzeBatch}
                disabled={loading || !batchText.trim()}
                className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Analyzing...' : '🔍 Analyze All'}
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Results</h2>
              {!batchResults && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <span className="text-4xl mb-2">📋</span>
                  <p className="text-sm">Batch results appear here</p>
                </div>
              )}
              {batchResults && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                      <div className="text-green-400 font-bold text-xl">
                        {batchResults.filter(r => r.sentiment === 'POSITIVE').length}
                      </div>
                      <div className="text-white/40 text-xs">Positive</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                      <div className="text-red-400 font-bold text-xl">
                        {batchResults.filter(r => r.sentiment === 'NEGATIVE').length}
                      </div>
                      <div className="text-white/40 text-xs">Negative</div>
                    </div>
                  </div>
                  {batchResults.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${
                      r.sentiment === 'POSITIVE'
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}>
                      <p className="text-white text-sm truncate">{r.text}</p>
                      <p className={`text-xs font-semibold mt-1 ${
                        r.sentiment === 'POSITIVE' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {r.sentiment === 'POSITIVE' ? '😊' : '😞'} {r.sentiment} · {Math.round(r.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>📜</span> Analysis History
            </h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-sm">No analyses yet — go to Single tab and analyze some text!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <HistoryItem key={i} item={item} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-10 pb-8 text-white/20 text-xs">
          Built with Python · scikit-learn · FastAPI · React · Tailwind CSS
        </div>
      </div>
    </div>
  )
}