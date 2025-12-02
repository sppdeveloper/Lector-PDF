// Global Configuration
// Change this URL when deploying to the main server
const GLOBAL_CONFIG = {
    baseUrl: "http://localhost:80/Lector-PDF/"
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
    // Listen for when dFlip opens
    $(document).on('df:openstart', function (e, flipbook) {
        // Add "Return to Library" button
        addReturnToLibraryButton();

        // Customize navigation buttons with Font Awesome icons after a short delay
        setTimeout(function () {
            customizeNavigationButtons();
        }, 500);
    });

    // Remove button when dFlip closes
    $(document).on('df:closeend', function () {
        removeReturnToLibraryButton();
    });
}

// Add "Return to Library" button
function addReturnToLibraryButton() {
    // Remove existing button if any
    removeReturnToLibraryButton();

    // Create button with Font Awesome icon
    const backBtn = $('<button>')
        .addClass('custom-back-btn')
        .html('<i class="fas fa-arrow-left"></i> Regresar a la biblioteca')
        .on('click', function () {
            // Close the dFlip viewer
            if (window.DFLIP && window.DFLIP.getBooks) {
                const books = window.DFLIP.getBooks();
                if (books && books.length > 0) {
                    books[0].dispose();
                }
            }
            // Alternative: trigger close on any open flipbook
            $('._df_book-stage').trigger('click');
            $('._df_lightbox-close').trigger('click');
        });

    $('body').append(backBtn);
}

// Remove "Return to Library" button
function removeReturnToLibraryButton() {
    $('.custom-back-btn').remove();
}

// Customize navigation buttons with Font Awesome icons
function customizeNavigationButtons() {
    // Add icons to previous button
    $('.df-ui-prev').each(function () {
        if (!$(this).find('i').length) {
            $(this).html('<i class="fas fa-chevron-left"></i>');
        }
    });

    // Add icons to next button
    $('.df-ui-next').each(function () {
        if (!$(this).find('i').length) {
            $(this).html('<i class="fas fa-chevron-right"></i>');
        }
    });

    // Add icons to other common controls if they exist
    $('.df-ui-zoom-in').each(function () {
        if (!$(this).find('i').length) {
            $(this).prepend('<i class="fas fa-search-plus"></i> ');
        }
    });

    $('.df-ui-zoom-out').each(function () {
        if (!$(this).find('i').length) {
            $(this).prepend('<i class="fas fa-search-minus"></i> ');
        }
    });

    $('.df-ui-fullscreen').each(function () {
        if (!$(this).find('i').length) {
            $(this).prepend('<i class="fas fa-expand"></i> ');
        }
    });

    $('.df-ui-share').each(function () {
        if (!$(this).find('i').length) {
            $(this).prepend('<i class="fas fa-share-alt"></i> ');
        }
    });

    $('.df-ui-download').each(function () {
        if (!$(this).find('i').length) {
            $(this).prepend('<i class="fas fa-download"></i> ');
        }
    });
}
