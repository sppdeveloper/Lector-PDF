// Global Configuration
// Change this URL when deploying to the main server
const GLOBAL_CONFIG = {
    baseUrl: window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1)
};

$(document).ready(function () {
    loadLibrary();
    setupDFlipCustomizations();
});

function loadLibrary() {
    $.getJSON('data.json', function (data) {
        // Update Site Config
        if (data.config) {
            if (data.config.site_title) {
                $('#site-title').text(data.config.site_title);
                document.title = data.config.site_title;
            }
            if (data.config.welcome_message) {
                $('#welcome-message').text(data.config.welcome_message);
            }
        }

        // Render Files
        const container = $('#library-container');
        container.empty();

        if (data.files && data.files.length > 0) {
            data.files.forEach(file => {
                const card = createBookCard(file);
                container.append(card);
            });
        } else {
            container.html('<p>No hay documentos disponibles.</p>');
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error("Error loading data.json:", error);
        $('#library-container').html('<p>Error al cargar la configuración. Por favor verifica el archivo data.json.</p>');
    });
}

function createBookCard(file) {
    let pdfUrl = file.file_path;
    let thumbUrl = file.thumbnail_path;

    if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
        pdfUrl = GLOBAL_CONFIG.baseUrl + pdfUrl;
    }
    if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith('/')) {
        thumbUrl = GLOBAL_CONFIG.baseUrl + thumbUrl;
    }

    // Create HTML structure
    const card = $('<div>').addClass('book-card');

    card.attr('source', pdfUrl);
    card.attr('id', 'df_' + file.id);

    const img = $('<img>').addClass('book-thumbnail').attr('src', thumbUrl || 'https://via.placeholder.com/300x400?text=No+Cover');
    const info = $('<div>').addClass('book-info');
    const title = $('<div>').addClass('book-title').text(file.title);
    const desc = $('<div>').addClass('book-description').text(file.description);
    const btn = $('<a>').addClass('read-btn').text('Leer Documento');

    info.append(title, desc, btn);
    card.append(img, info);

    // Click event to open dFlip
    card.on('click', function (e) {
        e.preventDefault();
    });

    // Better approach: Make the "Read" button a dFlip trigger
    btn.addClass('_df_button');
    btn.attr('source', pdfUrl);

    // If we want the whole card to trigger it, we can wrap the content or trigger the button click
    card.on('click', function (e) {
        if (!$(e.target).is('a')) {
            btn.trigger('click');
        }
    });

    return card;
}

// Setup dFlip customizations
function setupDFlipCustomizations() {
    // MutationObserver: Vigila cuando dFlip inyecta el visor en el HTML
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                // Verificar si es un nodo HTML
                if (node.nodeType !== 1) return;
                const $node = $(node);

                // 1. DETECTAR APERTURA DEL VISOR (Contenedor principal)
                if ($node.hasClass('df-lightbox-wrapper') || $node.hasClass('_df_book-stage')) {
                    console.log("Visor abierto. Agregando botón regresar...");
                    addReturnToLibraryButton();
                }

                // 2. DETECTAR BARRA DE HERRAMIENTAS (Para cambiar iconos)
                // dFlip carga la UI (df-ui-wrapper) un poco después del contenedor
                if ($node.hasClass('df-ui-wrapper') || $node.find('.df-ui-wrapper').length > 0) {
                    console.log("Barra de herramientas detectada. Cambiando iconos...");
                    customizeNavigationButtons();
                }
            });

            // 3. DETECTAR CIERRE
            mutation.removedNodes.forEach(function (node) {
                if (node.nodeType === 1 && ($(node).hasClass('df-lightbox-wrapper') || $(node).hasClass('_df_book-stage'))) {
                    removeReturnToLibraryButton();
                }
            });
        });
    });

    // Iniciar observación en el body
    observer.observe(document.body, {
        childList: true,
        subtree: true // Importante: buscar en profundidad para encontrar la toolbar
    });
}

// Add "Return to Library" button
function addReturnToLibraryButton() {
    // Evitar duplicados
    removeReturnToLibraryButton();

    // Lógica robusta para cerrar
    const closeViewer = function () {
        console.log("Intentando cerrar visor...");

        // Método 1: Simular clic en el botón nativo de cerrar de dFlip
        const nativeCloseBtn = $('.df-ui-close');
        if (nativeCloseBtn.length > 0) {
            nativeCloseBtn.trigger('click');
        } else {
            // Método 2 (Fallback): Forzar cierre del lightbox
            // Nota: dFlip suele usar jQuery, así que trigger click es lo más seguro.
            // Si eso falla, removemos la clase activa o el nodo.
            $('.df-lightbox-wrapper').removeClass('df-active').hide();
            setTimeout(() => $('.df-lightbox-wrapper').remove(), 100); // Limpieza final
            $('body').removeClass('df-lightbox-open'); // Restaurar scroll del body
        }
    };

    const backBtnLeft = $('<button>')
        .addClass('custom-back-btn custom-back-btn-left')
        .html('<i class="fas fa-arrow-left"></i> Regresar')
        .on('click', closeViewer);

    $('body').append(backBtnLeft);
}

// Remove "Return to Library" button
function removeReturnToLibraryButton() {
    $('.custom-back-btn').remove();
}

// Customize navigation buttons with Font Awesome icons
function customizeNavigationButtons() {
    // Mapa de selectores de dFlip a iconos FontAwesome
    const iconMap = {
        '.df-ui-thumbnail': '<i class="fas fa-th-large"></i>',
        '.df-ui-outline': '<i class="fas fa-list"></i>',
        '.df-ui-zoomin': '<i class="fas fa-plus"></i>',
        '.df-ui-zoomout': '<i class="fas fa-minus"></i>',
        '.df-ui-fullscreen': '<i class="fas fa-expand"></i>',
        '.df-ui-share': '<i class="fas fa-share-alt"></i>',
        '.df-ui-more': '<i class="fas fa-ellipsis-h"></i>',
        '.df-ui-download': '<i class="fas fa-download"></i>',
        '.df-ui-print': '<i class="fas fa-print"></i>',
        '.df-ui-close': '<i class="fas fa-times"></i>',
        '.df-ui-prev': '<i class="fas fa-chevron-left"></i>',
        '.df-ui-next': '<i class="fas fa-chevron-right"></i>',
        '.df-ui-sound': '<i class="fas fa-volume-up"></i>'
    };

    // Aplicar cambios
    $.each(iconMap, function (selector, html) {
        // Usamos .html() para reemplazar el contenido, 
        // pero el CSS que añadimos ocultará el ::before original
        $(selector).html(html);
    });
}

// Observe toolbar changes and reapply icons
function observeToolbarChanges() {
    // Find the toolbar container
    const toolbar = document.querySelector('.df-ui-controls, .df-ui-wrapper, [class*="df-ui"]');

    if (!toolbar) {
        // If toolbar not found yet, try again later
        setTimeout(observeToolbarChanges, 500);
        return;
    }

    // Create observer to watch for changes
    const observer = new MutationObserver(function (mutations) {
        customizeNavigationButtons();
    });

    // Start observing
    observer.observe(toolbar, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

