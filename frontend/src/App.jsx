import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import DormDetailPage from "./pages/DormDetailPage.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dorms/:id" element={<DormDetailPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}