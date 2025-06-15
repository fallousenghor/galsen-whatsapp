// Système de modales personnalisées
export class ModalManager {
  static show(options) {
    const {
      title = 'Confirmation',
      message = '',
      type = 'confirm', // confirm, alert, custom
      confirmText = 'Confirmer',
      cancelText = 'Annuler',
      onConfirm = () => {},
      onCancel = () => {},
      customContent = ''
    } = options;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal-backdrop"></div>
        
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div class="modal-content inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${this.getIconBg(type)} sm:mx-0 sm:h-10 sm:w-10">
                <i class="${this.getIcon(type)} text-white"></i>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">${title}</h3>
                <div class="mt-2">
                  ${customContent || `<p class="text-sm text-gray-500">${message}</p>`}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            ${type === 'confirm' ? `
              <button type="button" class="modal-confirm w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                ${confirmText}
              </button>
              <button type="button" class="modal-cancel mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                ${cancelText}
              </button>
            ` : `
              <button type="button" class="modal-close w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                OK
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animation d'entrée
    setTimeout(() => {
      modal.querySelector('.modal-backdrop').classList.add('opacity-100');
      modal.querySelector('.modal-content').classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    }, 10);

    // Gestion des événements
    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    const closeModal = () => {
      modal.querySelector('.modal-backdrop').classList.remove('opacity-100');
      modal.querySelector('.modal-content').classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    };

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        onCancel();
        closeModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal();
      });
    }

    backdrop.addEventListener('click', () => {
      if (type === 'confirm') {
        onCancel();
      }
      closeModal();
    });

    return modal;
  }

  static getIconBg(type) {
    switch (type) {
      case 'confirm': return 'bg-yellow-100';
      case 'error': return 'bg-red-100';
      case 'success': return 'bg-green-100';
      default: return 'bg-blue-100';
    }
  }

  static getIcon(type) {
    switch (type) {
      case 'confirm': return 'fas fa-question-circle text-yellow-600';
      case 'error': return 'fas fa-exclamation-triangle text-red-600';
      case 'success': return 'fas fa-check-circle text-green-600';
      default: return 'fas fa-info-circle text-blue-600';
    }
  }

  static confirm(message, onConfirm, onCancel) {
    return this.show({
      message,
      type: 'confirm',
      onConfirm,
      onCancel
    });
  }

  static alert(message, title = 'Information') {
    return this.show({
      title,
      message,
      type: 'alert'
    });
  }
}