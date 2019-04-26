Vue.component('schedules', {
    props: ['schedule_list'],
    template:
    `
    <table class="table table-sm" contenteditable="true">
            <thead class="">
                <th>#</th>
                <th>Channel</th>
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
            </thead>
            <tbody>
                <tr
                    is="schedule"
                    v-for="schedule in schedule_list" :key="schedule.id"
                    :id="schedule.id"
                    :channel="schedule.channel"
                    :device_id="schedule.device_id"
                    :start_time="schedule.start_time"
                    :stop_time="schedule.stop_time"
                    :monday="schedule.monday"
                    :tuesday="schedule.tuesday"
                    :wednesday="schedule.wednesday"
                    :thursday="schedule.thursday"
                    :friday="schedule.friday"
                    :saturday="schedule.saturday"
                    :sunday="schedule.sunday"
                    ></tr>
            </tbody>
        </table>
    `
})

Vue.component('schedule', {
    props: ['id', 'channel', 'device_id', 'start_time', 'stop_time', 'validity_start', 'validity_end', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'node'],
    data () {
        return {
            bus: new Vue(),
        }
    },
    template:
    `<tr>
        <td>{{ id }}</td>
        <td>{{ channel }}</td>
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
    </tr>`
})

new Vue({
    el: '#recording_guides',
    data: {
        apiURL: 'api/',
        schedule_list: [],
        loading: true,
        errored: false
    },
    created () {
        this.getRecordingGuidesData()
    },
    methods: {
        getRecordingGuidesData: function (scheduleID = false) {
            var endpoint = scheduleID ? this.apiURL + scheduleID : this.apiURL
            
            fetch(endpoint).then(response => response.json())
            .then(data => this.schedule_list = data)
            .catch(error => {
                console.log(error)
                this.errored = true
            })
            .finally(() => this.loading = false)
        }
    }
})