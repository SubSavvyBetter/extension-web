chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      chrome.storage.local.get(["subscriptions"], (data) => {
        const subscriptions = data.subscriptions || [];
        const currentTabUrl = tab.url.toLowerCase(); // Convertir l'URL en minuscule pour éviter les problèmes de casse
  
        // Recherche dans les abonnements si un nom d'abonnement correspond à l'URL
        const matchedService = subscriptions.find((sub) =>
          currentTabUrl.includes(sub.name.toLowerCase()) // Vérifie si le nom de l'abonnement est présent dans l'URL
        );
  
        if (matchedService) {
          console.log(`Abonnement trouvé : ${matchedService.name}`);
        } else {
          console.log("Aucun abonnement trouvé pour ce site.");
        }
      });
    }
  });
  