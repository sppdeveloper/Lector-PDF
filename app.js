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
    const nocache = new Date().getTime();

    $.getJSON('data.json?v=' + nocache, function (data) {
        // 1. Configurar Título y Mensaje
        if (data.config) {
            if (data.config.site_title) {
                $('#site-title').text(data.config.site_title);
                document.title = data.config.site_title;
            }
            if (data.config.welcome_message) {
                $('#welcome-message').text(data.config.welcome_message);
            }
        }

        // 2. Renderizar Libros
        const container = $('#library-container');
        container.empty();

        if (data.files && data.files.length > 0) {
            data.files.forEach(file => {
                const card = createBookCard(file);
                container.append(card);
            });

            // 3. NUEVO: Verificar si hay un ID en la URL y abrirlo automáticamente
            checkUrlParamAndOpen();

        } else {
            container.html('<p>No hay documentos disponibles.</p>');
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error("Error loading data.json:", error);
        $('#library-container').html('<p>Error al cargar la configuración.</p>');
    });
}

// Función para leer la URL y abrir el libro específico
function checkUrlParamAndOpen() {
    // Obtener parámetros de la URL (ej: ?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (bookId) {
        console.log("ID detectado en URL:", bookId);

        // Buscamos la tarjeta que tenga el ID 'df_[numero]'
        // Nota: En createBookCard asignamos id="df_ + file.id"
        const targetCard = $('#df_' + bookId);

        if (targetCard.length > 0) {
            // Esperamos un momento breve para asegurar que dFlip esté listo
            setTimeout(function () {
                // Hacemos scroll hasta la tarjeta (opcional, por si está muy abajo)
                $('html, body').animate({
                    scrollTop: targetCard.offset().top - 100
                }, 500);

                // Simulamos el clic en el botón de leer dentro de esa tarjeta
                console.log("Abriendo documento...");
                targetCard.find('.read-btn').trigger('click');
            }, 500);
        } else {
            console.warn("No se encontró ningún documento con el ID:", bookId);
        }
    }
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

    const card = $('<div>').addClass('book-card');

    // IMPORTANTE: Este ID es el que buscamos desde la URL
    card.attr('id', 'df_' + file.id);

    card.attr('source', pdfUrl);

    const img = $('<img>').addClass('book-thumbnail').attr('src', thumbUrl || 'https://via.placeholder.com/300x400?text=No+Cover');
    const info = $('<div>').addClass('book-info');
    const title = $('<div>').addClass('book-title').text(file.title);
    const desc = $('<div>').addClass('book-description').text(file.description);

    const btn = $('<a>').addClass('read-btn').text('Leer Documento');

    // Configuración dFlip
    btn.addClass('_df_button');
    btn.attr('source', pdfUrl);
    btn.attr('df-webgl', 'true');

    info.append(title, desc, btn);
    card.append(img, info);

    card.on('click', function (e) {
        e.preventDefault();
        if (!$(e.target).is('a')) {
            btn.trigger('click');
        }
    });

    return card;
}

// Setup dFlip customizations
function setupDFlipCustomizations() {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                    const $node = $(node);
                    if ($node.hasClass('df-lightbox-wrapper') || $node.hasClass('_df_book-stage')) {
                        addReturnToLibraryButton();
                    }
                    if ($node.hasClass('df-ui-wrapper') || $node.find('.df-ui-wrapper').length > 0) {
                        customizeNavigationButtons();
                    }
                }
            });
            mutation.removedNodes.forEach(function (node) {
                if (node.nodeType === 1 && ($(node).hasClass('df-lightbox-wrapper') || $(node).hasClass('_df_book-stage'))) {
                    removeReturnToLibraryButton();
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// Add "Return to Library" button
function addReturnToLibraryButton() {
    removeReturnToLibraryButton();
    const closeViewer = function () {
        // Al regresar, limpiamos la URL para que no se vuelva a abrir el libro si recarga
        // Usamos history.pushState para cambiar la URL sin recargar
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);

        const nativeClose = $('.df-ui-close');
        if (nativeClose.length) nativeClose.trigger('click');
        else {
            $('.df-lightbox-wrapper').removeClass('df-active').hide();
            setTimeout(() => $('.df-lightbox-wrapper').remove(), 100);
            $('body').removeClass('df-lightbox-open');
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