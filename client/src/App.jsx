import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TaxPlanner from './pages/TaxPlanner';
import LoanExtinguisher from './pages/LoanExtinguisher';
import Investments from './pages/Investments';

function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tax-planner" element={<TaxPlanner />} />
                    <Route path="/loan-extinguisher" element={<LoanExtinguisher />} />
                    <Route path="/investments" element={<Investments />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
