// src/pages/Home.jsx
import React from 'react';

function Home({ user }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Välkommen till Kalenderjämförelsen!</h1>
      {user ? (
        <p className="text-green-600">Inloggad som {user.name}</p>
      ) : (
        <>
          <p className="text-red-600 mb-2">Du är inte inloggad.</p>
          <a
            href="http://localhost:3000/auth/google"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Logga in med Google
          </a>
        </>
      )}
    </div>
  );
}

export default Home;
