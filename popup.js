document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
    const addButton = document.getElementById("add-button");
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabUrl = tabs[0].url.toLowerCase(); // Utilise la version minuscule de l'URL
  
      chrome.storage.local.get(["subscriptions"], (data) => {
        const subscriptions = data.subscriptions || [];
        const matchedSubscription = subscriptions.find((sub) =>
          currentTabUrl.includes(sub.name.toLowerCase()) // Recherche par nom de l'abonnement dans l'URL
        );
  
        const infoDiv = document.getElementById("subscription-info");
  
        if (matchedSubscription) {
          infoDiv.textContent = `Abonnement trouvé : ${matchedSubscription.name} (${matchedSubscription.price}€)`;
        } else {
          infoDiv.textContent = "Aucun abonnement trouvé pour ce site.";
        }
      });
    });
  
    addButton.addEventListener("click", () => {
      openAddForm();
    });
  });
  
  function openAddForm() {
    const formHtml = `
      <form id="add-subscription-form">
        <label>Nom de l'abonnement :
          <input type="text" id="name" required />
        </label>
        <label>Prix (€) :
          <input type="number" id="price" required />
        </label>
        <label>Période d'essai :
          <input type="checkbox" id="trial" />
        </label>
        <label>Date de début :
          <input type="date" id="start_date" required />
        </label>
        <label>Date de fin :
          <input type="date" id="end_date" required />
        </label>
        <button type="submit">Ajouter</button>
      </form>
    `;
  
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = formHtml;
  
    const form = document.getElementById("add-subscription-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
  
      const newSubscription = {
        name: document.getElementById("name").value,
        price: parseFloat(document.getElementById("price").value),
        trial: document.getElementById("trial").checked,
        status: "ACTIVE",
        start_date: new Date(document.getElementById("start_date").value).toISOString(),
        end_date: new Date(document.getElementById("end_date").value).toISOString(),
      };
  
      chrome.storage.local.get(["subscriptions"], (data) => {
        const subscriptions = data.subscriptions || [];
        subscriptions.push(newSubscription);
        chrome.storage.local.set({ subscriptions }, () => {
          alert("Abonnement ajouté avec succès !");
          window.close();
        });
      });
    });
  }
  