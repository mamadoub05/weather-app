import { useState, useEffect } from 'react'

function SearchHistory() {
  const [searches, setSearches] = useState([])

  const fetchSearches = async () => {
    const response = await fetch('http://127.0.0.1:8000/searches')
    const data = await response.json()
    setSearches(data)
  }

  useEffect(() => {
    fetchSearches()
  }, [])

  const deleteSearch = async (id) => {
    await fetch(`http://127.0.0.1:8000/searches/${id}`, {
      method: 'DELETE'
    })
    fetchSearches()
  }

  const exportJSON = () => {
    window.open('http://127.0.0.1:8000/export/json', '_blank')
  }

  const exportCSV = () => {
    window.open('http://127.0.0.1:8000/export/csv', '_blank')
  }

  return (
    <div className="history">
      <h2>Search History</h2>
      <div className="export-buttons">
        <button onClick={exportJSON}>Export JSON</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>
      {searches.length === 0 ? (
        <p className="message">No searches yet.</p>
      ) : (
        <div className="history-list">
          {searches.map(s => (
            <div className="history-item" key={s.id}>
              <div className="history-info">
                <span className="history-city">{s.city}, {s.country}</span>
                <span className="history-temp">{Math.round(s.temp)}°F</span>
                <span className="history-desc">{s.description}</span>
                <span className="history-date">
                  {new Date(s.searched_at).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => deleteSearch(s.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchHistory