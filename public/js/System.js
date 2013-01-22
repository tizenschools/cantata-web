( function() {

    System = Model.extend( {} );

    SystemStorage = Model.extend( {
        defaults: {
            total: "",
            usage: "",
            remainder: ""
        },
        url: function() {
            return '/system/storage';
        }
    });

    SystemInfoView = WindowView.extend( {
        templateId: '#system-storage',

        initialize: function() {
            Logger.trace( 'system info view init' );
            this.model.fetch();
            this.$storageChart = $( this.template( this.model ) );
        },

        getTitle: function() {
            return 'Storage';
        },

        createContents: function() {
            Logger.trace( 'create system info view' );
            var storage = this.model;
            Logger.log( storage );
            Logger.log( storage.get( 'total' ) + ',' + storage.attributes.total );
            Logger.log( storage.toJSON() );
            var t = this.model.get( 'total' );
            var u = this.model.get( 'usage' );
            var r = this.model.get( 'remainder' );

            Logger.trace( 'Total: ' + t + ', Usage: ' + u + ', Remain: ' + r );

            this.contents.append( this.$storageChart );
            var s1 = [['Sony',7], ['Samsumg',13.3], ['LG',14.7], ['Vizio',5.2], ['Insignia', 1.2]];
         
    var plot8 = $.jqplot('storage-pie', [s1], {
        grid: {
            drawBorder: false, 
            drawGridlines: false,
            background: '#ffffff',
            shadow:false
        },
        axesDefaults: {
             
        },
        seriesDefaults:{
            renderer:$.jqplot.PieRenderer,
            rendererOptions: {
                showDataLabels: true
            }
        },
        legend: {
            show: true,
            rendererOptions: {
                numberRows: 1
            },
            location: 's'
        }
    }); 
        }
    } );

} ) ();
