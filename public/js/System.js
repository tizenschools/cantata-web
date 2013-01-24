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
            this.model.bind( 'change', this.createContents, this );
            this.model.fetch();
            this.$storageChart = $( this.template( this.model ) );
        },

        getTitle: function() {
            return 'Storage';
        },

        createContents: function() {
            Logger.trace( 'create system info view' );
            var storage = this.model;
            var t = this.model.get( 'total' );
            var u = this.model.get( 'usage' );
            var r = this.model.get( 'remainder' );

            Logger.trace( 'Total: ' + t + ', Usage: ' + u + ', Remain: ' + r );

            this.$body.append( this.$storageChart );
            var data = [['Usage',Number(u)], ['Remain',Number(r)] ];
         
            var chart = $.jqplot('storage-pie', [data], {
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
