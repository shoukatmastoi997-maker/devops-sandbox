pipeline {
    agent any
    
    environment {
        DOCKERHUB_USERNAME = "shoukat999"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out Code from GitHub"
            }
        }
        
        stage('Copying .env file') {
            steps {
                withCredentials([file(credentialsId: 'backend-env', variable: 'envvariable')]) {
                    sh "cp \$envvariable ./backend/.env.example"
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                sh "docker build -t ${DOCKERHUB_USERNAME}/hotel-ai-reservation-backend:v1 ./backend"
            }
        }
        
        stage('Build Frontend') {
            steps {
                sh "docker build -t ${DOCKERHUB_USERNAME}/hotel-ai-reservation-frontend:v1 ./frontend"
            }
        }
        
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh "echo \$PASS | docker login -u \$USER --password-stdin"
                }
            }
        }

        stage("Pushing Backend") {
            steps {
                sh "docker push ${DOCKERHUB_USERNAME}/hotel-ai-reservation-backend:v1"
            }
        }

        stage("Pushing Frontend") {
            steps {
                sh "docker push ${DOCKERHUB_USERNAME}/hotel-ai-reservation-frontend:v1"
            }
        }
<<<<<<< HEAD
    }
    
    post {
        success {
            echo "Pipeline Completed Successfully"
        }
        failure {
            echo "Pipeline Failed"
        }
=======
>>>>>>> 7264912f29d71b9585a180e155f2e44d9673f958
    }
    
    post {
        success {
            echo "Pipeline Completed Successfully"
        }
        failure {
            echo "Pipeline Failed"
        }
    }
}
