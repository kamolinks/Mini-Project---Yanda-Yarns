

import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth();
  const db = window.db;
  document.getElementById('customRequestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const description = document.getElementById('requestDescription').value;
    const statusDiv = document.getElementById('requestStatus');

    if (!auth.currentUser) {
      statusDiv.textContent = "You must be logged in to submit a request.";
      const loginModal = document.getElementById('modal');
      loginModal.classList.remove('hidden');
      return;
    }

    if (!description.trim()) {
      statusDiv.textContent = "Please enter a description for your request.";
      return;
    }

    try {
      const { serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
      await addDoc(collection(db, "requests"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        description: description,
        status: "pending",
        createdAt: serverTimestamp()
      });
      statusDiv.textContent = "Request submitted successfully!\nWe will get back to you soon with a price.";
      this.reset();
    } catch (error) {
      statusDiv.textContent = "Error submitting request.";
      console.error(error);
    }
  });
});

      
