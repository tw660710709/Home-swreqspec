import { NavLink, Link } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `pb-1 font-medium ${isActive ? "border-b-2 border-dark" : "hover:text-primary"}`;

export default function Navbar() {
  return (
    <header className="bg-cream">
      <nav className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <Link to="/" className="text-2xl font-bold sm:text-3xl">
          DORM-DEE (หอดี)
        </Link>
        <div className="ml-auto flex items-center gap-4 sm:gap-8">
          <NavLink
            to="/"
            end
            className={(props) => `${linkClass(props)} whitespace-nowrap`}
          >
            หน้าแรก
          </NavLink>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark text-white">
            K
          </div>
        </div>
      </nav>
    </header>
  );
}