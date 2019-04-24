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
        <td>{{ monday }}</td>
        <td>{{ tuesday }}</td>
        <td>{{ wednesday }}</td>
        <td>{{ thursday }}</td>
        <td>{{ friday }}</td>
        <td>{{ saturday }}</td>
        <td>{{ sunday }}</td>
        <td>{{ node }}</td>
    </tr>`
})

new Vue({
    el: '#recording_guides',
    data: {
        apiURL: 'data/',
        guides: [],
        loading: true,
        errored: false,
        modal: false
    },
    created () {
        this.getRecordingGuidesData()
    },
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