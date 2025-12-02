// Global Configuration
const GLOBAL_CONFIG = {
    baseUrl: window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1)
};

$(document).ready(function () {
    loadLibrary();
    setupDFlipCustomizations();

    $('#search-input').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        $('#library-container .book-card').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

function loadLibrary() {
    const nocache = new Date().getTime();

    $.getJSON('data.json?v=' + nocache, function (data) {
        if (data.config) {
            if (data.config.site_title) {
                $('#site-title').text(data.config.site_title);
                document.title = data.config.site_title;
            }
        }

        const container = $('#library-container');
        container.empty();

        if (data.files && data.files.length > 0) {
            data.files.forEach(file => {
                const card = createBookCard(file);
                container.append(card);
            });

            // Forzar inicialización de dFlip
            setTimeout(function () {
                if (typeof DFLIP !== 'undefined' && DFLIP.parseBooks) {
                    DFLIP.parseBooks();
                    console.log("dFlip inicializado");
                }
            }, 100);

            checkUrlParamAndOpen();

        } else {
            container.html('<p>No hay documentos disponibles.</p>');
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error("Error loading data.json:", error);
        $('#library-container').html('<p>Error al cargar la configuración.</p>');
    });
}

function checkUrlParamAndOpen() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (bookId) {
        console.log("ID detectado en URL:", bookId);
        const targetCard = $('#df_' + bookId);

        if (targetCard.length > 0) {
            setTimeout(function () {
                $('html, body').animate({
                    scrollTop: targetCard.offset().top - 100
                }, 500);
                targetCard.find('.read-btn').trigger('click');
            }, 800);
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
    card.attr('id', 'df_' + file.id);

    const img = $('<img>').addClass('book-thumbnail').attr('src', thumbUrl || 'https://via.placeholder.com/300x400?text=No+Cover');
    const info = $('<div>').addClass('book-info');
    const title = $('<div>').addClass('book-title').text(file.title);
    const desc = $('<div>').addClass('book-description').text(file.description);

    const btn = $('<a>').addClass('read-btn').text('Leer Documento');

    btn.addClass('_df_button');
    btn.attr('source', pdfUrl);
    btn.attr('webgl', 'true');

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

function setupDFlipCustomizations() {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                    const $node = $(node);

                    if ($node.hasClass('df-lightbox-wrapper') || $node.hasClass('_df_book-stage')) {
                        addReturnToLibraryButton();
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function addReturnToLibraryButton() {
    removeReturnToLibraryButton();

    const closeViewer = function () {
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

    window.history.pushState({ modalOpen: true }, '', window.location.href);

    $(window).on('popstate', function (event) {
        const nativeClose = $('.df-ui-close');
        if (nativeClose.length) {
            nativeClose.trigger('click');
            $(window).off('popstate');
        }
    });
}