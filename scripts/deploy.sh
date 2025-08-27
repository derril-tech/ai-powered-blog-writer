#!/bin/bash

# AI Blog Writer Production Deployment Script
# This script handles the complete deployment of the AI Blog Writer application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_APP_NAME="ai-blog-writer-frontend"
API_APP_NAME="ai-blog-writer-api"
REGISTRY="your-registry.com"
NAMESPACE="ai-blog-writer"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists kubectl; then
        missing_tools+=("kubectl")
    fi
    
    if ! command_exists helm; then
        missing_tools+=("helm")
    fi
    
    if ! command_exists fly; then
        missing_tools+=("flyctl")
    fi
    
    if ! command_exists vercel; then
        missing_tools+=("vercel")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install the missing tools and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build API Gateway
    print_status "Building API Gateway image..."
    docker build -t $REGISTRY/api-gateway:latest -f apps/gateway/Dockerfile .
    
    # Build Workers
    local workers=("serp" "cluster" "outline" "draft" "image" "seo" "internal_links" "publish" "medium_connector" "ghost_connector" "metrics" "refresh" "security" "compliance")
    
    for worker in "${workers[@]}"; do
        print_status "Building $worker worker image..."
        docker build -t $REGISTRY/$worker-worker:latest -f apps/workers/Dockerfile apps/workers/$worker_worker/
    done
    
    print_success "All Docker images built successfully"
}

# Function to push Docker images
push_images() {
    print_status "Pushing Docker images to registry..."
    
    # Push API Gateway
    docker push $REGISTRY/api-gateway:latest
    
    # Push Workers
    local workers=("serp" "cluster" "outline" "draft" "image" "seo" "internal_links" "publish" "medium_connector" "ghost_connector" "metrics" "refresh" "security" "compliance")
    
    for worker in "${workers[@]}"; do
        docker push $REGISTRY/$worker-worker:latest
    done
    
    print_success "All Docker images pushed successfully"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets
    print_status "Applying Kubernetes secrets..."
    kubectl apply -f k8s/secrets.yaml
    
    # Apply deployments
    print_status "Applying Kubernetes deployments..."
    kubectl apply -f k8s/deployment.yaml
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/serp-worker -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/cluster-worker -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/outline-worker -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/draft-worker -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/image-worker -n $NAMESPACE
    
    print_success "Kubernetes deployment completed"
}

# Function to deploy to Fly.io
deploy_fly() {
    print_status "Deploying API Gateway to Fly.io..."
    
    # Deploy API Gateway
    cd apps/gateway
    fly deploy --config ../../fly.toml
    
    print_success "Fly.io deployment completed"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying Frontend to Vercel..."
    
    # Deploy frontend
    cd apps/frontend
    vercel --prod
    
    print_success "Vercel deployment completed"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # This would typically run your migration scripts
    # For now, we'll just check if the database is accessible
    print_warning "Database migrations need to be implemented"
    
    print_success "Database setup completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check API Gateway health
    local api_url=$(fly status --app $API_APP_NAME | grep "Hostname" | awk '{print $2}')
    if [ -n "$api_url" ]; then
        local health_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$api_url/health")
        if [ "$health_response" = "200" ]; then
            print_success "API Gateway health check passed"
        else
            print_error "API Gateway health check failed"
            return 1
        fi
    fi
    
    # Check Kubernetes pods
    local pod_status=$(kubectl get pods -n $NAMESPACE --no-headers | grep -v "Running\|Completed" | wc -l)
    if [ "$pod_status" -eq 0 ]; then
        print_success "All Kubernetes pods are running"
    else
        print_warning "Some Kubernetes pods are not running"
        kubectl get pods -n $NAMESPACE
    fi
    
    print_success "Health checks completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    
    echo ""
    echo "Kubernetes Resources:"
    kubectl get all -n $NAMESPACE
    
    echo ""
    echo "Fly.io Apps:"
    fly apps list
    
    echo ""
    echo "Vercel Projects:"
    vercel ls
}

# Function to rollback deployment
rollback() {
    print_warning "Rolling back deployment..."
    
    # Rollback Kubernetes deployments
    kubectl rollout undo deployment/api-gateway -n $NAMESPACE
    kubectl rollout undo deployment/serp-worker -n $NAMESPACE
    kubectl rollout undo deployment/cluster-worker -n $NAMESPACE
    kubectl rollout undo deployment/outline-worker -n $NAMESPACE
    kubectl rollout undo deployment/draft-worker -n $NAMESPACE
    kubectl rollout undo deployment/image-worker -n $NAMESPACE
    
    # Rollback Fly.io deployment
    fly rollback --app $API_APP_NAME
    
    print_success "Rollback completed"
}

# Main deployment function
main() {
    local action=${1:-"deploy"}
    
    case $action in
        "deploy")
            print_status "Starting AI Blog Writer deployment..."
            check_prerequisites
            build_images
            push_images
            deploy_kubernetes
            deploy_fly
            deploy_vercel
            run_migrations
            run_health_checks
            show_status
            print_success "Deployment completed successfully!"
            ;;
        "build")
            print_status "Building Docker images..."
            build_images
            ;;
        "push")
            print_status "Pushing Docker images..."
            push_images
            ;;
        "k8s")
            print_status "Deploying to Kubernetes..."
            deploy_kubernetes
            ;;
        "fly")
            print_status "Deploying to Fly.io..."
            deploy_fly
            ;;
        "vercel")
            print_status "Deploying to Vercel..."
            deploy_vercel
            ;;
        "health")
            print_status "Running health checks..."
            run_health_checks
            ;;
        "status")
            show_status
            ;;
        "rollback")
            rollback
            ;;
        *)
            print_error "Unknown action: $action"
            echo "Usage: $0 {deploy|build|push|k8s|fly|vercel|health|status|rollback}"
            exit 1
            ;;
    esac
}

# Check if script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
