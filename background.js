chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      chrome.storage.local.get("token", (data) => {
        const token = data.token;
        if (!token) {
          console.log("Utilisateur non connecté. Impossible de récupérer les abonnements.");
          return;
        }
  
        // Requête pour récupérer tous les abonnements depuis l'API
        fetch("https://api.subsavvy.xyz/subscriptions", {
          method: "GET",
          headers: {
            Authorization: token,
            Accept: "*/*",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Erreur lors de la récupération des abonnements.");
            }
            return response.json();
          })
          .then((subscriptions) => {
            const currentTabUrl = tab.url.toLowerCase(); // Convertir l'URL en minuscule pour éviter les problèmes de casse
  
            // Recherche si un abonnement correspond à l'URL
            const matchedService = subscriptions.find((sub) =>
              currentTabUrl.includes(sub.name.toLowerCase()) // Vérifie si le nom de l'abonnement est présent dans l'URL
            );
  
            if (!matchedService) {
              // Si aucun abonnement ne correspond, afficher une notification
              chrome.notifications.create({
                type: "basic",
                iconUrl: "logo.png", // Remplacez par le chemin vers l'icône de votre extension
                title: "Abonnement non trouvé",
                message: "N'oubliez pas d'ajouter cet abonnement à votre liste !",
                priority: 2,
              });
            } else {
              console.log(`Abonnement trouvé : ${matchedService.name}`);
            }
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération des abonnements :", error);
          });
      });
    }
  });
  