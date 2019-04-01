Vue.component('node', {
    props: ['id', 'ip_address', 'label', 'ping', 'obs_status', 'channel_id', 'uptime', 'cron', 'screenshot_url'],
    data () {
        return {
            hover: false,
            bus: new Vue(),
        }
    },
    updated () {
        row = this.$el
        var overlay = row.querySelector('.node-overlay')
        rowPos = row.getBoundingClientRect()

        overlay.style.top = rowPos.top
        overlay.style.right = rowPos.right
        overlay.style.height = rowPos.height
        overlay.style.width = 350
        overlay.style.left = rowPos.right - 350
    },
    methods: {
        show_screenshot() {
            this.bus.$emit('show_screenshot')
        },
        show_cron() {
            this.bus.$emit('show_cron')
        },
        obs (action) {
            endpoint = this.$root.apiURL + this.id + '/obs?action=' + action
            
            fetch(endpoint).then(response => response.json())
            .then(data => this.obs_status = data.response)
            .catch(error => {
                console.log(error)
            })
        }
    },
    template:
    `<tr class="node"
        @mouseover="hover = true"
        @mouseleave="hover = false">
        <td class="node-id">{{ id }}</td>
        <td class="node-ip_address">{{ ip_address }}</td>
        <td class="node-label">{{ label }}</td>
        <td v-if="ping" class="node-obs_status">{{ obs_status }}</td>
        <td v-else colspan="99" class="text-center">Host Unreachable!</td>
        <td v-if="ping" class="node-cpu">
            <netdata-cpu
            :ip_address="ip_address"></netdata-cpu>
        </td>
        <td v-if="ping" class="node-temp">
            <netdata-temp
            :id="id"
            :ip_address="ip_address"></netdata-temp>
        </td>
        <td v-if="ping" class="node-ram">
            <netdata-ram
            :ip_address="ip_address"></netdata-ram>
        </td>
        <td v-if="ping" class="node-channel_id">{{ channel_id }}</td>
        <td v-if="ping" class="node-uptime">{{ uptime }}</td>
        <td v-if="ping" class="node-overlay" v-show="hover">
            <button @click="show_screenshot()" title="Screenshot" class="btn"><i class="fas fa-camera"></i></button>
            <button @click="show_cron()" title="Cron" class="btn"><i class="fas fa-hourglass-start"></i></button>
            <button @click="obs('start_recording')" title="Start Recording" class="btn"><i class="fas fa-play"></i></i></button>
            <button @click="obs('stop_recording')" title="Stop Recording" class="btn"><i class="fas fa-stop-circle"></i></button>
        </td>
        <screenshot v-if="ping"
            :bus="bus"
            :id="id"
            :ip_address="ip_address"
            :label="label"
            :screenshot_url="screenshot_url"></screenshot>
        <cron v-if="ping"
            :bus="bus"
            :id="id"
            :ip_address="ip_address"
            :label="label"
            :cron="cron"></cron>
    </tr>`
})

Vue.component('netdata-cpu', {
    props: ['ip_address'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="system.cpu"
            :data-host="'http://' + ip_address + ':19999/'"
            data-chart-library="dygraph"
            data-legend="no"
            data-dygraph-valuerange="[0, 100]"
            data-height="70px"
            data-width="200px"
            data-after="-100"
            data-title=""
            data-units=""></div>`
})

Vue.component('netdata-temp', {
    props: ['ip_address'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="sensors.coretemp_isa_0000_temperature"
            :data-host="'http://' + ip_address + ':19999/'"
            data-dimensions="coretemp-isa-0000_temp1"
            data-chart-library="gauge"
            data-gauge-max-value="60"
            data-width="100px"
            data-after="-100"
            data-title="Celsius"
            data-units=""></div>`
})

Vue.component('netdata-ram', {
    props: ['ip_address'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="system.ram"
            :data-host="'http://' + ip_address + ':19999/'"
            data-dimensions="used|buffers|active|wired"
            data-chart-library="easypiechart"
            data-append-options="percentage"
            data-easypiechart-linewidth="4"
            data-easypiechart-scaleColor="false"
            data-easypiechart-max-value="100"
            data-width="80px"
            data-after="-100"
            data-title=""
            data-units=""></div>`
})

Vue.component('screenshot', {
    props: ['bus', 'id', 'ip_address', 'label', 'screenshot_url'],
    data () {
        return {
            image_url: this.screenshot_url,
            visible: false
        }
    },
    methods: {
        open () {
            this.$root.modal = true
            this.visible = true
        },
        close () {
            this.visible = false
            this.$root.modal = false
        },
        refresh () {
            endpoint = this.$root.apiURL + this.id + '/screenshot?response=json'

            fetch(endpoint).then(response => response.json())
            .then(data => this.image_url = data.screenshot_url)
            .catch(error => {
                console.log(error)
            })
        }
    },
    mounted () {
        this.bus.$on('show_screenshot', this.open)
    },
    template:
    `<div v-show="visible" class="modal node-modal" style="display: block">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-body">
                    <img v-if="image_url" :src="image_url" class="img-fluid"/>
                    <p v-else class="text-center">No image available...</p>
                </div>
                <div class="modal-footer">
                    <h4 class="modal-title mr-auto">{{ label }} <small><code>[{{ ip_address}}]</code></small></h4>
                    <button type="button" class="btn btn-primary" @click="refresh()">Refresh</button>
                    <button type="button" class="btn btn-secondary" @click="close()">Close</button>
                </div>
            </div>
        </div>
    </div>`
})

Vue.component('cron', {
    props: ['bus', 'id', 'ip_address', 'label', 'cron'],
    data () {
        return {
            visible: false
        }
    },
    methods: {
        open () {
            this.$root.modal = true
            this.visible = true
        },
        close () {
            this.visible = false
            this.$root.modal = false
        }
    },
    mounted () {
        this.bus.$on('show_cron', this.open)
    },
    template:
    `<div v-show="visible" class="modal node-modal" style="display: block">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cron</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <pre>{{ cron }}</pre>
                </div>
                <div class="modal-footer">
                    <h4 class="modal-title mr-auto">{{ label }} <small><code>[{{ ip_address}}]</code></small></h4>
                    <button type="button" class="btn btn-secondary" @click="close()">Close</button>
                </div>
            </div>
        </div>
    </div>`
})

new Vue({
    el: '#dashboard',
    data: {
        apiURL: '/dashboard/nodes/',
        nodes: [],
        loading: true,
        errored: false,
        modal: false
    },
    created () {
        this.getNodeData()
    },
    methods: {
        getNodeData: function (nodeID = false) {
            var endpoint = nodeID ? this.apiURL + nodeID : this.apiURL
            
            fetch(endpoint).then(response => response.json())
            .then(data => this.nodes = data.nodes)
            .catch(error => {
                console.log(error)
                this.errored = true
            })
            .finally(() => this.loading = false)
        }
    }
})