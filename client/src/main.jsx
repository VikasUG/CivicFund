import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from 'react-router-dom';
import App from "./App";

import {StateContextProvider} from './context';
import { ThirdwebProvider } from "@thirdweb-dev/react";
import ErrorBoundary from './components/ErrorBoundary';
// import "./styles/globals.css";

import './index.css';

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ThirdwebProvider 
      activeChain="localhost"
      clientId="d54aa09b4052abe1db0ecdcaede65096"
    >
      <StateContextProvider>
        <Router>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </Router>
      </StateContextProvider>
    </ThirdwebProvider>
  </React.StrictMode>
);
