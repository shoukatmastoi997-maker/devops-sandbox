pipeline {
    agent any
    
    environment {
        DOCKERHUB_USERNAME = "shoukat999"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out Code from GitHub"
                echo "Also added webhook to trigger this pipeline on every push to main branch"
            }
        }
        
        stage('Copying .env file') {
            steps {
                // copying env file from Jenkins credentials to backend directory
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
