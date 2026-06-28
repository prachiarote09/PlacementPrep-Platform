import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import VoiceRecorder from "./pages/VoiceRecorder";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import InterviewSetup from "./pages/InterviewSetup";
import AptitudeModule from "./pages/AptitudeModule";
import CodingModule from "./pages/Codingmodule";
import Analytics from "./pages/Analytics";
import History from "./pages/History";

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics/>
            </ProtectedRoute>
          }
        />
         <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <VoiceRecorder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview-setup"
          element={
            <ProtectedRoute>
              <InterviewSetup/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/aptitude"
          element={
            <ProtectedRoute>
              <AptitudeModule/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coding"
          element={
            <ProtectedRoute>
              <CodingModule/>
            </ProtectedRoute>
          }
        />
         
        {/* Default route */}
        <Route path="*" element={<Signup />} />

      </Routes>
    </Router>
  );
}

export default App;