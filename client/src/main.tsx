import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { configureAxiosDefaults } from './lib/api.ts'

configureAxiosDefaults();

createRoot(document.getElementById("root")!).render(<App />);
