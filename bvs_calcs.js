// vim: foldmethod=marker

// {{{1 PhaseSim
const PhaseSim = (function () { "use strict";
    let PhaseSim = {};
    return PhaseSim;
})(); // PhaseSim
// 1}}}

// {{{1 Main
(function () { "use strict";
    let tab_bar = $('#tab-bar');
    let current_tab = 'phasesim';

    function changeTab() {
        tab_bar.'.tab-sel ['

    function tabselClick(event) {
        if (!event.target.hasAttribute('data-tab')) {
            throw Error(
        current_tab = event.target.getAttribute('data-tab');
        changeTab();
    }
        
   

})(); // Main
// 1}}}


