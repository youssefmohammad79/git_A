<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robot Fleet Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background-color: #2a3646;
            color: white;
            padding: 15px 0;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        MQTT_HOST
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        
        .connection-status {
            background-color: #fff;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .status-indicator {
            display: inline-block;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
            background-color: #f44336;
        }
        
        .status-indicator.connected {
            background-color: #4CAF50;
        }
        
        .dashboard-row {
            display: flex;
            flex-wrap: wrap;
            margin: 0 -10px;
        }
        
        .dashboard-card {
            flex: 1;
            min-width: 300px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            margin: 10px;
            padding: 20px;
        }
        
        .dashboard-card h2 {
            margin-top: 0;
            font-size: 18px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 10px;
            color: #2a3646;
        }
        
        .robot-list {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .robot-card {
            flex: 1;
            min-width: 220px;
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 15px;
            border-left: 4px solid #2a3646;
            position: relative;
        }
        
        .robot-card.overloaded {
            border-left-color: #f44336;
        }
        
        .robot-card.master {
            border-left-color: #9c27b0;
        }
        
        .robot-card.helper {
            border-left-color: #2196f3;
        }
        
        .robot-card h3 {
            margin-top: 0;
            font-size: 16px;
            display: flex;
            align-items: center;
        }
        
        .robot-details {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }
        
        .robot-details div {
            margin-bottom: 5px;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin-top: 5px;
            overflow: hidden;
        }
        
        .progress-bar-fill {
            height: 100%;
            background-color: #4CAF50;
            transition: width 0.3s ease;
        }
        
        .progress-bar-fill.warning {
            background-color: #ff9800;
        }
        
        .progress-bar-fill.danger {
            background-color: #f44336;
        }
        
        .log-container {
            height: 300px;
            overflow-y: auto;
            background-color: #2a3646;
            color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        }
        
        .log-entry {
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid #3d4a5c;
        }
        
        .log-time {
            color: #a5d6a7;
            margin-right: 10px;
        }
        
        .task-history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        .task-history-table th,
        .task-history-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .task-history-table th {
            font-weight: 600;
            color: #2a3646;
        }
        
        .map-container {
            position: relative;
            height: 400px;
            background-color: #f0f0f0;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .robot-marker {
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #2a3646;
            transform: translate(-50%, -50%);
            transition: all 0.5s ease;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
        }
        
        .robot-marker.overloaded {
            background-color: #f44336;
        }
        
        .robot-marker.master {
            background-color: #9c27b0;
        }
        
        .robot-marker.helper {
            background-color: #2196f3;
        }
        
        .connection-line {
            position: absolute;
            height: 2px;
            background-color: #9c27b0;
            transform-origin: 0 0;
            z-index: 1;
        }
        
        .chart-container {
            height: 300px;
        }
        
        @media (max-width: 768px) {
            .dashboard-card {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Robot Fleet Dashboard</h1>
    </div>
    
    <div class="container">
        <div class="connection-status">
            <div>
                <span class="status-indicator" id="status-indicator"></span>
                <span id="connection-status-text">Disconnected</span>
            </div>
            <div>
                <button id="connect-btn">Connect</button>
                <button id="disconnect-btn" disabled>Disconnect</button>
            </div>
        </div>
        
        <div class="dashboard-row">
            <div class="dashboard-card">
                <h2>Fleet Status</h2>
                <div class="robot-list" id="robot-list">
                    <!-- Robot cards will be added here dynamically -->
                </div>
            </div>
        </div>
        
        <div class="dashboard-row">
            <div class="dashboard-card">
                <h2>Robot Positions</h2>
                <div class="map-container" id="robot-map">
                    <!-- Robot markers will be added here dynamically -->
                </div>
            </div>
        </div>
        
        <div class="dashboard-row">
            <div class="dashboard-card">
                <h2>Battery Levels</h2>
                <div class="chart-container">
                    <canvas id="battery-chart"></canvas>
                </div>
            </div>
            
            <div class="dashboard-card">
                <h2>Load Levels</h2>
                <div class="chart-container">
                    <canvas id="load-chart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="dashboard-row">
            <div class="dashboard-card">
                <h2>Task History</h2>
                <table class="task-history-table" id="task-history-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Task ID</th>
                            <th>Master</th>
                            <th>Helper</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="task-history-body">
                        <!-- Task history rows will be added here dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="dashboard-row">
            <div class="dashboard-card">
                <h2>System Log</h2>
                <div class="log-container" id="system-log">
                    <!-- Log entries will be added here dynamically -->
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // MQTT Client Configuration
        const MQTT_HOST = '192.168.209.167';  // Change to your MQTT broker host
        const MQTT_PORT = 9001;         // WebSocket port for MQTT broker
        const MQTT_CLIENT_ID = 'dashboard_' + Math.random().toString(16).substr(2, 8);
        
        // MQTT Topics
        const TOPIC_STATUS = 'robots/status';
        const TOPIC_HELP_REQUEST = 'robots/help_request';
        const TOPIC_TASK_COMPLETE = 'robots/task_complete';
        const TOPIC_ENCODER_DATA = 'robots/encoder_data';
        const TOPIC_UPTIME = 'robots/uptime';
        
        // Robot State Enum
        const RobotState = {
            IDLE: 0,
            OVERLOADED: 1,
            MASTER: 2,
            HELPER: 3,
            ERROR: 4
        };
        
        // Robot data store
        let robots = {};
        let taskHistory = [];
        
        // Charts
        let batteryChart;
        let loadChart;
        
        // MQTT Client
        let mqttClient;
        let isConnected = false;
        
        // DOM Elements
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('connection-status-text');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const robotList = document.getElementById('robot-list');
        const robotMap = document.getElementById('robot-map');
        const taskHistoryBody = document.getElementById('task-history-body');
        const systemLog = document.getElementById('system-log');
        
        // Initialize the dashboard
        function initDashboard() {
            // Setup event listeners
            connectBtn.addEventListener('click', connectMQTT);
            disconnectBtn.addEventListener('click', disconnectMQTT);
            
            // Initialize charts
            initCharts();
            
            // Try to connect to MQTT automatically
            connectMQTT();
            
            // Update UI every second
            setInterval(updateUI, 1000);
        }
        
        // Initialize charts
        function initCharts() {
            // Battery level chart
            const batteryCtx = document.getElementById('battery-chart').getContext('2d');
            batteryChart = new Chart(batteryCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Battery Level (%)',
                        data: [],
                        backgroundColor: '#4CAF50',
                        borderColor: '#388E3C',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                } 
            });
            
            // Load level chart
            const loadCtx = document.getElementById('load-chart').getContext('2d');
            loadChart = new Chart(loadCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Load Level (%)',
                        data: [],
                        backgroundColor: '#2196F3',
                        borderColor: '#1976D2',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
        
        // Connect to MQTT broker
        function connectMQTT() {
            addLog('Connecting to MQTT broker...');
            
            mqttClient = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, MQTT_CLIENT_ID);
            
            // Set callback handlers
            mqttClient.onConnectionLost = onConnectionLost;
            mqttClient.onMessageArrived = onMessageArrived;
            
            // Connect the client
            mqttClient.connect({
                onSuccess: onConnect,
                onFailure: onConnectionFailure,
                useSSL: false
            });
        }
        
        // Disconnect from MQTT broker
        function disconnectMQTT() {
            if (mqttClient && isConnected) {
                mqttClient.disconnect();
                isConnected = false;
                updateConnectionStatus();
                addLog('Disconnected from MQTT broker');
            }
        }
        
        // Called when the client connects
        function onConnect() {
            isConnected = true;
            updateConnectionStatus();
            addLog('Connected to MQTT broker');
            
            // Subscribe to topics
            mqttClient.subscribe(TOPIC_STATUS);
            mqttClient.subscribe(TOPIC_HELP_REQUEST);
            mqttClient.subscribe(TOPIC_TASK_COMPLETE);
            mqttClient.subscribe(TOPIC_ENCODER_DATA);
            mqttClient.subscribe(TOPIC_UPTIME);
            
            addLog('Subscribed to robot topics');
        }
        
        // Called when the connection fails
        function onConnectionFailure(responseObject) {
            isConnected = false;
            updateConnectionStatus();
            addLog('Connection failed: ' + responseObject.errorMessage);
        }
        
        // Called when the client loses its connection
        function onConnectionLost(responseObject) {
            isConnected = false;
            updateConnectionStatus();
            
            if (responseObject.errorCode !== 0) {
                addLog('Connection lost: ' + responseObject.errorMessage);
            }
        }
        
        // Called when a message arrives
        function onMessageArrived(message) {
            const topic = message.destinationName;
            const payload = JSON.parse(message.payloadString);
            
            // Process message based on topic
            switch (topic) {
                case TOPIC_STATUS:
                    processStatusUpdate(payload);
                    break;
                case TOPIC_HELP_REQUEST:
                    processHelpRequest(payload);
                    break;
                case TOPIC_TASK_COMPLETE:
                    processTaskComplete(payload);
                    break;
                case TOPIC_ENCODER_DATA:
                    processEncoderData(payload);
                    break;
                case TOPIC_UPTIME:
                    processUptimeData(payload);
                    break;
            }
        }
        
        // Process robot status update
        function processStatusUpdate(data) {
            const robotId = data.id;
            
            // Create robot entry if it doesn't exist
            if (!robots[robotId]) {
                robots[robotId] = {
                    id: robotId,
                    status: RobotState.IDLE,
                    battery: 100,
                    load: 0,
                    position: { x: 0, y: 0 },
                    uptime: 0,
                    encoders: [0, 0, 0, 0],
                    lastUpdate: Date.now(),
                    helper: null,
                    master: null,
                    taskId: null
                };
                addLog(`New robot detected: ${robotId}`);
            }
            
            // Update robot data
            robots[robotId].status = data.status;
            robots[robotId].battery = data.battery;
            robots[robotId].load = data.load;
            robots[robotId].position = data.position;
            robots[robotId].lastUpdate = Date.now();
            
            // Update master/helper relationships
            if (data.status === RobotState.MASTER) {
                robots[robotId].helper = data.helper;
                robots[robotId].taskId = data.taskId;
                addLog(`Robot ${robotId} is now master with helper ${data.helper} for task ${data.taskId}`);
            } else if (data.status === RobotState.HELPER) {
                robots[robotId].master = data.master;
                robots[robotId].taskId = data.taskId;
                addLog(`Robot ${robotId} is now helper for master ${data.master} for task ${data.taskId}`);
            } else {
                // Clear relationships if not in master/helper state
                if (robots[robotId].helper || robots[robotId].master) {
                    addLog(`Robot ${robotId} returned to normal operation`);
                }
                robots[robotId].helper = null;
                robots[robotId].master = null;
                robots[robotId].taskId = null;
            }
        }
        
        // Process help request
        function processHelpRequest(data) {
            const robotId = data.id;
            addLog(`Help request from ${robotId}: Load ${data.load}%, Position (${data.position.x.toFixed(2)}, ${data.position.y.toFixed(2)})`);
            
            // Update task history
            taskHistory.unshift({
                time: new Date(),
                taskId: data.taskId,
                master: robotId,
                helper: null,
                duration: null,
                status: 'Requested'
            });
            
            // Keep only the 20 most recent tasks
            if (taskHistory.length > 20) {
                taskHistory.pop();
            }
        }
        
        // Process task completion
        function processTaskComplete(data) {
            const robotId = data.id;
            const taskId = data.taskId;
            const helper = data.helper;
            const duration = data.duration;
            
            addLog(`Task ${taskId} completed by ${robotId} with helper ${helper} in ${duration}s`);
            
            // Update task history
            for (let i = 0; i < taskHistory.length; i++) {
                if (taskHistory[i].taskId === taskId) {
                    taskHistory[i].helper = helper;
                    taskHistory[i].duration = duration;
                    taskHistory[i].status = 'Completed';
                    break;
                }
            }
        }
        
        // Process encoder data
        function processEncoderData(data) {
            const robotId = data.id;
            
            // Create robot entry if it doesn't exist
            if (!robots[robotId]) {
                return;
            }
            
            // Update encoder data
            robots[robotId].encoders = [
                data.encoder1,
                data.encoder2,
                data.encoder3,
                data.encoder4
            ];
        }
        
        // Process uptime data
        function processUptimeData(data) {
            const robotId = data.id;
            
            // Create robot entry if it doesn't exist
            if (!robots[robotId]) {
                return;
            }
            
            // Update uptime
            robots[robotId].uptime = data.uptime;
            robots[robotId].battery = data.battery;
        }
        
        // Update connection status UI
        function updateConnectionStatus() {
            statusIndicator.className = isConnected ? 'status-indicator connected' : 'status-indicator';
            statusText.textContent = isConnected ? 'Connected' : 'Disconnected';
            
            connectBtn.disabled = isConnected;
            disconnectBtn.disabled = !isConnected;
        }
        
        // Update the entire UI
        function updateUI() {
            updateRobotList();
            updateRobotMap();
            updateCharts();
            updateTaskHistory();
        }
        
        // Update robot list display
        function updateRobotList() {
            robotList.innerHTML = '';
            
            for (const robotId in robots) {
                const robot = robots[robotId];
                
                // Create robot card element
                const robotCard = document.createElement('div');
                robotCard.className = 'robot-card';
                
                // Set card style based on robot state
                if (robot.status === RobotState.OVERLOADED) {
                    robotCard.classList.add('overloaded');
                } else if (robot.status === RobotState.MASTER) {
                    robotCard.classList.add('master');
                } else if (robot.status === RobotState.HELPER) {
                    robotCard.classList.add('helper');
                }
                
                // Get status text
                let statusText = 'Idle';
                switch (robot.status) {
                    case RobotState.OVERLOADED:
                        statusText = 'Overloaded';
                        break;
                    case RobotState.MASTER:
                        statusText = `Master (Helper: ${robot.helper})`;
                        break;
                    case RobotState.HELPER:
                        statusText = `Helper (Master: ${robot.master})`;
                        break;
                    case RobotState.ERROR:
                        statusText = 'Error';
                        break;
                }
                
                // Calculate time since last update
                const timeSinceUpdate = Math.floor((Date.now() - robot.lastUpdate) / 1000);
                
                // Build card content
                robotCard.innerHTML = `
                    <h3>${robotId}</h3>
                    <div class="robot-details">
                        <div>Status: ${statusText}</div>
                        <div>Battery: ${robot.battery}%</div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill ${getBatteryColorClass(robot.battery)}" style="width: ${robot.battery}%"></div>
                        </div>
                        <div>Load: ${robot.load}%</div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill ${getLoadColorClass(robot.load)}" style="width: ${robot.load}%"></div>
                        </div>
                        <div>Position: (${robot.position.x.toFixed(2)}, ${robot.position.y.toFixed(2)})</div>
                        <div>Uptime: ${formatUptime(robot.uptime)}</div>
                        <div>Last update: ${timeSinceUpdate}s ago</div>
                    </div>
                `;
                
                robotList.appendChild(robotCard);
            }
        }
        
        // Update robot map display
        function updateRobotMap() {
            robotMap.innerHTML = '';
            
            // Calculate map scale
            let minX = 0, maxX = 10, minY = 0, maxY = 10;
            
            for (const robotId in robots) {
                const robot = robots[robotId];
                minX = Math.min(minX, robot.position.x);
                maxX = Math.max(maxX, robot.position.x);
                minY = Math.min(minY, robot.position.y);
                maxY = Math.max(maxY, robot.position.y);
            }
            
            // Add some padding
            minX -= 1;
            maxX += 1;
            minY -= 1;
            maxY += 1;
            
            const mapWidth = robotMap.clientWidth;
            const mapHeight = robotMap.clientHeight;
            
            const scaleX = mapWidth / (maxX - minX);
            const scaleY = mapHeight / (maxY - minY);
            
            // Create robot markers
            for (const robotId in robots) {
                const robot = robots[robotId];
                
                // Scale position to map
                const x = (robot.position.x - minX) * scaleX;
                const y = (robot.position.y - minY) * scaleY;
                
                // Create marker element
                const marker = document.createElement('div');
                marker.className = 'robot-marker';
                marker.textContent = robotId.replace('R', '');
                
                // Set marker style based on robot state
                if (robot.status === RobotState.OVERLOADED) {
                    marker.classList.add('overloaded');
                } else if (robot.status === RobotState.MASTER) {
                    marker.classList.add('master');
                } else if (robot.status === RobotState.HELPER) {
                    marker.classList.add('helper');
                }
                
                // Position marker
                marker.style.left = `${x}px`;
                marker.style.top = `${y}px`;
                
                robotMap.appendChild(marker);
                
                // Draw connection line for master-helper
                if (robot.status === RobotState.MASTER && robot.helper && robots[robot.helper]) {
                    const helper = robots[robot.helper];
                    const helperX = (helper.position.x - minX) * scaleX;
                    const helperY = (helper.position.y - minY) * scaleY;
                    
                    // Calculate line parameters
                    const dx = helperX - x;
                    const dy = helperY - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    // Create line element
                    const line = document.createElement('div');
                    line.className = 'connection-line';
                    line.style.width = `${distance}px`;
                    line.style.left = `${x}px`;
                    line.style.top = `${y}px`;
                    line.style.transform = `rotate(${angle}deg)`;
                    
                    robotMap.appendChild(line);
                }
            }
        }
        
        // Update charts display
        function updateCharts() {
            // Update battery chart
            const batteryLabels = [];
            const batteryData = [];
            
            for (const robotId in robots) {
                batteryLabels.push(robotId);
                batteryData.push(robots[robotId].battery);
            }
            
            batteryChart.data.labels = batteryLabels;
            batteryChart.data.datasets[0].data = batteryData;
            batteryChart.update();
            
            // Update load chart
            const loadLabels = [];
            const loadData = [];
            
            for (const robotId in robots) {
                loadLabels.push(robotId);
                loadData.push(robots[robotId].load);
            }
            
            loadChart.data.labels = loadLabels;
            loadChart.data.datasets[0].data = loadData;
            loadChart.update();
        }
        
        // Update task history display
        function updateTaskHistory() {
            taskHistoryBody.innerHTML = '';
            
            for (const task of taskHistory) {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${formatDateTime(task.time)}</td>
                    <td>${task.taskId}</td>
                    <td>${task.master}</td>
                    <td>${task.helper || '-'}</td>
                    <td>${task.duration ? task.duration + 's' : '-'}</td>
                    <td>${task.status}</td>
                `;
                
                taskHistoryBody.appendChild(row);
            }
        }
        
        // Add log entry
        function addLog(message) {
            const now = new Date();
            const timeStr = formatTime(now);
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `<span class="log-time">${timeStr}</span>${message}`;
            
            systemLog.appendChild(logEntry);
            systemLog.scrollTop = systemLog.scrollHeight;
            
            // Limit log entries to 100
            while (systemLog.children.length > 100) {
                systemLog.removeChild(systemLog.firstChild);
            }
        }
        
        // Helper function to get battery color class
        function getBatteryColorClass(batteryLevel) {
            if (batteryLevel < 20) {
                return 'danger';
            } else if (batteryLevel < 50) {
                return 'warning';
            }
            return '';
        }
        
        // Helper function to get load color class
        function getLoadColorClass(loadLevel) {
            if (loadLevel > 90) {
                return 'danger';
            } else if (loadLevel > 70) {
                return 'warning';
            }
            return '';
        }
        
        // Format uptime in human-readable format
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            seconds = seconds % 60;
            
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        
        // Format time as HH:MM:SS
        function formatTime(date) {
            return date.toTimeString().split(' ')[0];
        }
        
        // Format date and time
        function formatDateTime(date) {
            return `${formatTime(date)}`;
        }
        
        // Initialize the dashboard when the page loads
        window.addEventListener('load', initDashboard);
    </script>
</body>
</html>
