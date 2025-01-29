import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="div-center px-2">
      <h1>404 Page not found</h1>
      <div>
        <Link to="/">Back to homepage</Link>
      </div>
    </div>
  );
};

export default NotFound;
