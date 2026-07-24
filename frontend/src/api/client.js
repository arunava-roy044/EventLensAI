import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: API_URL,
})

export const getPortfolio = () => client.get('/portfolio')
export const getRisk = () => client.get('/portfolio/risk')
export const searchTickers = (query) => client.get('/search', { params: { q: query } })
export const addHolding = (ticker, shares) => client.post('/portfolio', { ticker, shares })
export const deleteHolding = (id) => client.delete(`/portfolio/${id}`)
export const updateHolding = (id, shares) => client.put(`/portfolio/${id}`, { shares })
export const getHistory = (ticker) => client.get(`/portfolio/history/${ticker}`)
export const getCorrelation = () => client.get('/portfolio/correlation')
export const predictEventImpact = (data) => client.post('/portfolio/event-impact', data)
export const getEventHistory = () => client.get('/portfolio/event-history')