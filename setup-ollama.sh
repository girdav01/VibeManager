#!/bin/bash

# Ollama Setup Script for VibeManager
# This script helps install and configure Ollama with the gpt-oss:20b model

set -e  # Exit on error

echo "🚀 Ollama Setup for VibeManager"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if Ollama is already installed
check_ollama() {
    if command -v ollama &> /dev/null; then
        print_success "Ollama is already installed"
        return 0
    else
        print_warning "Ollama is not installed"
        return 1
    fi
}

# Install Ollama
install_ollama() {
    print_info "Installing Ollama..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Detected Linux - installing via script"
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Detected macOS - installing via Homebrew"
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            print_error "Homebrew not found. Please install from https://ollama.com"
            exit 1
        fi
    else
        print_error "Unsupported OS. Please install manually from https://ollama.com"
        exit 1
    fi
    
    print_success "Ollama installed successfully"
}

# Start Ollama service
start_ollama() {
    print_info "Starting Ollama service..."
    
    # Check if already running
    if pgrep -x "ollama" > /dev/null; then
        print_success "Ollama service is already running"
        return 0
    fi
    
    # Try to start as a service (systemd)
    if command -v systemctl &> /dev/null; then
        if systemctl list-unit-files | grep -q ollama; then
            sudo systemctl start ollama
            print_success "Started Ollama via systemd"
            return 0
        fi
    fi
    
    # Start manually in background
    print_info "Starting Ollama in background..."
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    
    if pgrep -x "ollama" > /dev/null; then
        print_success "Ollama service started"
    else
        print_error "Failed to start Ollama service"
        exit 1
    fi
}

# Verify Ollama is accessible
verify_ollama() {
    print_info "Verifying Ollama connection..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            print_success "Ollama API is accessible"
            return 0
        fi
        
        print_warning "Attempt $attempt/$max_attempts - Waiting for Ollama..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Could not connect to Ollama API"
    exit 1
}

# Pull the required model
pull_model() {
    local model=${1:-"gpt-oss:20b"}
    
    print_info "Checking if model '$model' is available..."
    
    if ollama list | grep -q "$model"; then
        print_success "Model '$model' is already available"
        return 0
    fi
    
    print_warning "Model '$model' not found - pulling now..."
    print_info "This may take several minutes (model size: ~11GB)"
    
    ollama pull "$model"
    
    if [ $? -eq 0 ]; then
        print_success "Model '$model' pulled successfully"
    else
        print_error "Failed to pull model '$model'"
        exit 1
    fi
}

# Test the integration
test_integration() {
    print_info "Testing Ollama integration with VibeManager..."
    
    if [ -f "test-ollama.js" ]; then
        node test-ollama.js
    else
        print_warning "test-ollama.js not found, skipping integration test"
    fi
}

# Main installation flow
main() {
    echo "This script will:"
    echo "  1. Install Ollama (if not already installed)"
    echo "  2. Start the Ollama service"
    echo "  3. Pull the gpt-oss:20b model"
    echo "  4. Test the integration"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi
    
    echo ""
    echo "Step 1/4: Checking Ollama installation..."
    if ! check_ollama; then
        install_ollama
    fi
    
    echo ""
    echo "Step 2/4: Starting Ollama service..."
    start_ollama
    
    echo ""
    echo "Step 3/4: Verifying Ollama connection..."
    verify_ollama
    
    echo ""
    echo "Step 4/4: Pulling gpt-oss:20b model..."
    pull_model "gpt-oss:20b"
    
    echo ""
    echo "================================"
    print_success "Ollama setup completed!"
    echo "================================"
    echo ""
    print_info "Next steps:"
    echo "  1. Start the VibeManager app: npm run dev"
    echo "  2. Test the integration: node test-ollama.js"
    echo "  3. Read the migration guide: cat OLLAMA_MIGRATION.md"
    echo ""
    
    # Optional: Run integration test
    read -p "Run integration test now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        test_integration
    fi
}

# Run main function
main
