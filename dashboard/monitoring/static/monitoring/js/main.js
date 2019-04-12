Vue.component('node', {
    props: ['id', 'ip_address', 'label', 'ping', 'channel_id', 'uptime', 'cron', 'screenshot_url', 'netdata_host'],
    data () {
        return {
            hover: false,
            bus: new Vue(),
        }
    },
    methods: {
        show_screenshot() {
            this.bus.$emit('show_screenshot')
        },
        show_cron() {
            this.bus.$emit('show_cron')
        },
    },
    template:
    `<tr class="node"
        @mouseover="hover = true"
        @mouseleave="hover = false">
        <td class="node-id">{{ id }}</td>
        <td class="node-channel">
            <div class="h-100">
                <div class="pt-2">
                    <strong>{{ label }}</strong>
                    <sup><i class="fas fa-info-circle" :title="channel_id"></i></sup>
                </div>
                <div class="pt-2">
                    <code>[{{ ip_address }}]</code>
                </div>
            </div>
        </td>
        <td v-if="ping" class="node-obs text-center">
            <obs
            :id=id></obs>
        </td>
        <td v-else colspan="99" class="text-center">Host Unreachable!</td>
        <td v-if="ping" class="node-cpu text-center">
            <netdata-cpu
            :ip_address="ip_address"
            :netdata_host="netdata_host"></netdata-cpu>
        </td>
        <td v-if="ping" class="node-temp text-center">
            <netdata-temp
            :ip_address="ip_address"
            :netdata_host="netdata_host"></netdata-temp>
        </td>
        <td v-if="ping" class="node-ram text-center">
            <netdata-ram
            :ip_address="ip_address"
            :netdata_host="netdata_host"></netdata-ram>
        </td>
        <td v-if="ping" class="node-uptime text-center">{{ uptime }}</td>
        <td v-if="ping" class="node-actions">
            <button @click="show_screenshot()" title="Screenshot" class="btn btn-lg btn-outline-secondary"><i class="fas fa-camera"></i></button>
            <button @click="show_cron()" title="Cron" class="btn btn-lg btn-outline-secondary"><i class="fas fa-hourglass-start"></i></button>
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
    props: ['ip_address', 'netdata_host'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="system.cpu"
            :data-host="netdata_host"
            data-chart-library="dygraph"
            data-legend="no"
            data-dygraph-valuerange="[0, 100]"
            data-height="70px"
            data-width="220px"
            data-after="-100"
            data-title=""
            data-units=""></div>`
})

Vue.component('netdata-temp', {
    props: ['ip_address', 'netdata_host'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="sensors.coretemp_isa_0000_temperature"
            :data-host="netdata_host"
            data-dimensions="coretemp-isa-0000_temp1"
            data-chart-library="gauge"
            data-gauge-max-value="60"
            data-width="100px"
            data-after="-100"
            data-title="Celsius"
            data-units=""></div>`
})

Vue.component('netdata-ram', {
    props: ['ip_address', 'netdata_host'],
    mounted () {
        NETDATA.updatedDom()
    },
    template:
    `<div data-netdata="system.ram"
            :data-host="netdata_host"
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
            this.$root.modal = false
            this.visible = false
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
            visible: false,
            pretty_cron: []
        }
    },
    methods: {
        open () {
            this.$root.modal = true
            this.visible = true
        },
        close () {
            this.$root.modal = false
            this.visible = false
        },
        prettify () {
            var self = this
            if (this.cron == "no crontab for user" || this.cron == ""){}
            else {
                var cronjob_list = this.cron.split('\n');
                cronjob_list.forEach(function (cronjob){
                    exp = cronjob.split(/\s+/).slice(0,5).join(" ")
                    job = cronjob.split(/\s+/).slice(5).join(" ")
                    try {
                        self.pretty_cron.push({
                            'exp': cronstrue.toString(exp), 
                            'job': job
                        })
                    }
                    catch{ /*Don't push the string if it cannot be parsed by cronstrue*/ }
                })
            }
        }
    },
    created () {
        this.prettify()
    },
    mounted () {
        this.bus.$on('show_cron', this.open)
    },
    template:
    `<div v-show="visible" class="modal node-modal" style="display: block">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Task Scheduler</h5>
                    <button type="button" class="close" @click="close()">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <table v-if="pretty_cron.length" class="table table-borderless">
                        <thead>
                            <th>Schedule</th>
                            <th>Job</th>
                        </thead>
                        <tr v-for="cron in pretty_cron">
                            <td>{{ cron.exp }}</td>
                            <td><code>{{ cron.job }}</code></td>
                        </tr>
                    </table>
                    <code v-else>No Tasks Scheduled</code>
                </div>
                <div class="modal-footer">
                    <h4 class="modal-title mr-auto">{{ label }} <small><code>[{{ ip_address}}]</code></small></h4>
                    <button type="button" class="btn btn-secondary" @click="close()">Close</button>
                </div>
            </div>
        </div>
    </div>`
})

Vue.component('obs', {
    props: ['id'],
    data () {
        return {
            status: 'loading...',
            is_running: false,
            is_recording: false,
        }
    },
    mounted () {
        this.refresh()
    },
    methods: {
        action (arg) {
            var self = this
            return new Promise( function(resolve, reject) {
                fetch(self.$root.apiURL + self.id + '/obs?action=' + arg).then(response => response.json())
                .then(data => {
                    resolve(data.response)
                })
                .catch(error => {
                    console.log(error)
                })
            })
        },
        refresh () {
            this.action('is_running').then(response => {
                this.is_running = response
                
                if( this.is_running ){
                    this.action('is_recording').then(response => {
                        this.is_recording = response
                        this.status = this.is_recording ? 'Recording' : 'Not Recording'
                    })
                }
                else {
                    this.status = 'Not Running'
                }
            })
        },
        handle (arg) {
            this.action(arg)
            setTimeout(this.refresh, 1000)
        }
    },
    template:
    `<div class="h-100 text-center">
        <div class="pt-2">
            {{ status }}
        </div>
        <div class="pt-2">
            <button v-if="is_running" v-show="!is_recording" @click="handle('start_recording')" title="Start Recording" class="btn btn-outline-success"><i class="fas fa-play"></i></button>
            <button v-if="is_running" v-show="is_recording" @click="handle('stop_recording')" title="Stop Recording" class="btn btn-outline-danger"><i class="fas fa-stop"></i></button>
            <button v-if="is_running" @click="handle('reset_source')" title="Reset Source" class="btn btn-outline-warning"><i class="fas fa-sign-in-alt"></i></button>
            <button @click="refresh" title="Update" class="btn btn-outline-primary"><i class="fas fa-redo-alt"></i></button>
        </div>
    </div>`
})

new Vue({
    el: '#monitoring',
    data: {
        apiURL: 'nodes/',
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