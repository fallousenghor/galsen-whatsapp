export function menupup() {
  document.querySelectorAll('[class*="hover:bg-"]').forEach((item) => {
    item.addEventListener("click", function () {
      const text = this.querySelector("span").textContent;
      console.log(`Option sélectionnée: ${text}`);

      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 100);
    });
  });
  return `
  
  <div class="max-w-xs mx-auto">
    <div
      class="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-2 text-white "
    >
      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <path
            d="M12 16v-4M12 8h.01"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
        </svg>
        <span class="text-gray-200 text-sm">Infos du contact</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            ry="2"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
        </svg>
        <span class="text-gray-200 text-sm">Sélectionner des messages</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <path
            d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="22"
            y1="2"
            x2="2"
            y2="22"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Mode silencieux</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <polyline
            points="12,6 12,12 16,14"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
        </svg>
        <span class="text-gray-200 text-sm">Messages éphémères</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
        </svg>
        <span class="text-gray-200 text-sm">Ajouter aux Favoris</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Fermer la discussion</span>
      </div>

      <div class="border-t border-gray-600 my-2"></div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <path
            d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="4"
            y1="22"
            x2="4"
            y2="15"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Signaler</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="4.93"
            y1="4.93"
            x2="19.07"
            y2="19.07"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Bloquer</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Effacer la discussion</span>
      </div>

      <div
        class="flex items-center px-4 py-3 hover:bg-red-600 cursor-pointer transition-colors"
      >
        <svg class="icon text-gray-300 mr-3" viewBox="0 0 24 24">
          <polyline
            points="3,6 5,6 21,6"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <path
            d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
          <line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <span class="text-gray-200 text-sm">Supprimer la discussion</span>
      </div>
    </div>
  </div>


  `;
}
