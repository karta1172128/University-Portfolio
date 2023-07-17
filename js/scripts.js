$(document).ready(function () {
    /*
     * Scroll page.
     */
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function (event) {
        event.preventDefault();

        $("#MyMenu").collapse('hide');
        var target = $(this.getAttribute('href'));
        anime({
            targets: 'html, body',
            scrollTop: target.offset().top - 80,
            duration: 750,
            easing: 'easeInOutExpo'
        });
    });
    /*
     * Scroll spy.
     */
    $("body").scrollspy({ target: "#navbar", offset: 100 });
    /*
     * Auto hide MyMenu when click anywhere or scroll page.
     */
    $(document).click(function () {
        $("#MyMenu").collapse('hide');
    });

    $(window).scroll(function () {
        $("#MyMenu").collapse('hide');
    });
})  