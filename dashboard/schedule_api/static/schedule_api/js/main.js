Vue.component('recording_guides', {
    props: ['guides'],
    template:
    `
    <table class="table table-sm" contenteditable="true">
            <thead class="">
                <th>Id</th>
                <th>Channel name</th>
                <th>Device id</th>
                <th>Start time</th>
                <th>Stop time</th>
                <th>Validity start</th>
                <th>Validity end</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
                <th>Node</th>
            </thead>
            <tbody>
                <tr
                    is="recording_guide"
                    v-for="guide in guides" :key="guide.id"
                    :id="guide.id"
                    :channel_name="guide.channel_name"
                    :device_id="guide.device_id"
                    :start_time="guide.start_time"
                    :stop_time="guide.stop_time"
                    :monday="guide.monday"
                    :tuesday="guide.tuesday"
                    :wednesday="guide.wednesday"
                    :thursday="guide.thursday"
                    :friday="guide.friday"
                    :saturday="guide.saturday"
                    :sunday="guide.sunday"
                    :node="guide.node"
                    ></tr>
            </tbody>
        </table>
    `
})

Vue.component('recording_guide', {
    props: ['id', 'channel_name', 'device_id', 'start_time', 'stop_time', 'validity_start', 'validity_end', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'node'],
    data () {
        return {
            bus: new Vue(),
        }
    },
    template:
    `<tr>
        <td>{{ id }}</td>
        <td>{{ channel_name }}</td>
        <td>{{ device_id }}</td>
        <td>{{ start_time }}</td>
        <td>{{ stop_time }}</td>
        <td>{{ validity_start }}</td>
        <td>{{ validity_end }}</td>
        <td><i v-if="monday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="tuesday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="wednesday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="thursday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="friday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="saturday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="sunday" class="fas fa-check-circle text-success"></i></td>
        <td>{{ node }}</td>
    </tr>`
})

new Vue({
    el: '#recording_guides',
    methods: {
        getRecordingGuidesData: function (recordingGuideID = false) {
            var endpoint = recordingGuideID ? this.apiURL + nodeID : this.apiURL
            
            fetch(endpoint).then(response => response.json())
            .then(data => this.guides = data.guides)
            .catch(error => {
                console.log(error)
                this.errored = true
            })
            .finally(() => this.loading = false)
        }
    }
})