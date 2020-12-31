$(document).ready(function() {

    $('.card-handle').on('mousedown', function(event){
        console.log("mousedown.");
        // get parent card element, store in jquery variable
        // get starting width and height
        // starting coordinates of the mouse.
        // get delta: starting position and ending position.
        // add that shit up.
        // profit
        var $this = $(this);
        var $document = $(document);
        var $card = $this.parent(".card");
        var width = $card.width();
        var height = $card.height();
        console.log(width);
        console.log(height);
        var startX = event.clientX;
        var startY = event.clientY;

        // $this.addClass('grabbing');

        $document.one("mouseup", mouseup);
        $document.on("mousemove", mousemove);
        function mouseup(event){
            console.log("mouseup.");
            // $this.removeClass('grabbing');
            $document.off("mousemove", mousemove);
        }
        function mousemove(event){
            requestAnimationFrame(function() {
                $card.width(width + (event.clientX - startX));
                $card.height(height + (event.clientY - startY));
            });
            console.log(event.clientX, event.clientY);
        }
        
    });

    $('.editable').on('click', function() {
        var that = $(this);
        if (that.find('input').length > 0) {
            return;
        }
        var currentText = that.text();
        
        var $input = $('<input>').val(currentText)
        .css({
            'position': 'absolute',
            top: '0px',
            left: '0px',
            width: that.width(),
            height: that.height(),
            opacity: 0.9,
            padding: '10px'
        });
        
        $(this).append($input);
        
        // Handle outside click
        $(document).click(function(event) {
            if(!$(event.target).closest('.editable').length) {
                if ($input.val()) {
                    that.text($input.val());
                }
                that.find('input').remove();
            }
        });
    });
});

