import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from './pages/Portal';
import Manager from './pages/Manager';
import Cashier from './pages/Cashier';
import Customer from './pages/Customer';
import MenuBoard from './pages/MenuBoard';
import Kitchen from './pages/Kitchen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/manager" element={<Manager />} />
        <Route path="/cashier" element={<Cashier />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/menu-board" element={<MenuBoard />} />
        <Route path="/kitchen" element={<Kitchen />} />
      </Routes>
    </BrowserRouter>
  );
}
