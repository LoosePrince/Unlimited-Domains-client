import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NovelDetailPage from './pages/NovelDetailPage';
import CreateChapterPage from './pages/CreateChapterPage';
import NovelEditPage from './pages/NovelEditPage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import ReaderPage from './pages/ReaderPage';
import CustomReadingPathPage from './pages/CustomReadingPathPage';
import CommunityPage from './pages/CommunityPage';
import CommunityArticlePage from './pages/CommunityArticlePage';
import CommunityCreateArticlePage from './pages/CommunityCreateArticlePage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/novel/:id" element={<NovelDetailPage />} />
            <Route path="/novel/:novelId/create-chapter" element={<CreateChapterPage />} />
            <Route path="/novel/:novelId/edit" element={<NovelEditPage />} />
            <Route path="/novel/:id/custom-reading-path" element={<CustomReadingPathPage />} />
            <Route path="/novel/:novelId/read/:chapterId" element={<ReaderPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/create" element={<CommunityCreateArticlePage />} />
            <Route path="/community/articles/:id" element={<CommunityArticlePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
