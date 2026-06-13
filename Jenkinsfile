pipeline{
    agent any
    environment {
        DOCKERHUB_USERNAME = "shoukat999"
    }
    stages{
        stage('Checkout'){
            step{
                echo "Checking out Code from GitHub"
            }
        }
        stage('copying .env file'){
            steps{
                withcredentials([file(credentialsID: 'backend-env', variable: 'envvariable')]){
                    sh 'cp $envvariable ./backend/.env.example'
                }
            }
        }
        stage('Build Backend'){
            steps{
                sh 'docker build -t ${DOCKERHUB_USERNAME}/hotel-ai-reservation-backend:v1 ./backend'
            }
        }
        stage('Build Frontend'){
            step{
                sh 'docker build -t ${DOCKERHUB_USERNAME}/hotel-ai-reservation-frontend:v1 ./frontend'
            }
        }
        stage("Docker Login"){
            step{
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')])}{
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }

    }
}