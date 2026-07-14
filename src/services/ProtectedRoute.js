import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  console.log("ProtectedRoute check — token trouvé :", token); // <-- debug temporaire

  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
