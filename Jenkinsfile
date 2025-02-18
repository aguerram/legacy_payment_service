pipeline {
    agent any
    environment  {
                BRANCH_NAME = "${env.GIT_BRANCH.split('/').size() > 1 ? env.GIT_BRANCH.split('/')[1..-1].join('/') : env.GIT_BRANCH}"

    } 
    stages  {
        stage("Set environment") {
            steps {
                script {
                BRANCH_NAME = "${env.GIT_BRANCH.split('/').size() > 1 ? env.GIT_BRANCH.split('/')[1..-1].join('/') : env.GIT_BRANCH}"                
                echo "Setting environment for branch ${BRANCH_NAME}"
                }
              }
            } 
          
        stage("Build Docker Image and push to ECR"){
            steps   {
                script {
                docker.withRegistry("https://554521793576.dkr.ecr.me-south-1.amazonaws.com","ecr:me-south-1:ecr-staging") {
                      docker.build("paywise-backend:latest").push()
                    } 
                
                    }
                } 
            
        }
        stage("Deploy to EKS"){
            steps   {
                script {
                sh '''
                    kubectl rollout restart deployment/backend-prod
                 '''
                    }
                } 
            }
        
       
    }
}

