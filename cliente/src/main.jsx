import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ModalProvider } from './controllers/ModalContext.jsx';
import { AuthProvider } from './controllers/AuthContext.jsx';
import './views/styles/base.css';
import './views/styles/layout.css';
import './views/styles/componentes.css';
import './views/styles/modales.css';
import './views/styles/paginas.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ModalProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ModalProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
