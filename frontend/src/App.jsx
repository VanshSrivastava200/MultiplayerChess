import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { ChessGame } from "./pages/ChessGame";
import { Account } from "./pages/Account";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/chess" element={<ChessGame />}></Route>
        <Route path="/account" element={<Account />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
