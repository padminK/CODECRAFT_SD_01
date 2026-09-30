import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <strong>SlotBook</strong>
      {user ? (
        <>
          <Link to="/">Slots</Link>
          <Link to="/my-bookings">My Bookings</Link>
          {user.role === "ADMIN" && <Link to="/admin">Admin</Link>}
          <span className="spacer" />
          <span>{user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <span className="spacer" />
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
