#!/bin/bash

# Test Coverage Verification Script
# Checks backend (90% target) and frontend (80% target) test coverage

set -e

echo "=========================================="
echo "Test Coverage Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_TARGET=90
FRONTEND_TARGET=80

# Backend Coverage
echo "📊 Checking Backend Coverage (Target: ${BACKEND_TARGET}%)..."
echo "----------------------------------------"
cd apps/backend

# Check if pytest-cov is installed
if ! python -m pytest --version 2>/dev/null | grep -q pytest; then
    echo "${YELLOW}⚠️  pytest not found. Installing dependencies...${NC}"
    pip install -q pytest pytest-cov pytest-django
fi

# Run coverage
echo "Running backend tests with coverage..."
python -m pytest --cov=apps --cov-report=term --cov-report=html --cov-report=xml -q || {
    echo "${RED}❌ Backend tests failed${NC}"
    exit 1
}

# Extract coverage percentage from XML
if [ -f coverage.xml ]; then
    BACKEND_COVERAGE=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('coverage.xml')
root = tree.getroot()
coverage = float(root.attrib['line-rate']) * 100
print(f'{coverage:.2f}')
" 2>/dev/null || echo "0")
    
    if (( $(echo "$BACKEND_COVERAGE >= $BACKEND_TARGET" | bc -l) )); then
        echo "${GREEN}✅ Backend Coverage: ${BACKEND_COVERAGE}% (Target: ${BACKEND_TARGET}%)${NC}"
        BACKEND_PASS=true
    else
        echo "${RED}❌ Backend Coverage: ${BACKEND_COVERAGE}% (Target: ${BACKEND_TARGET}%)${NC}"
        BACKEND_PASS=false
    fi
else
    echo "${YELLOW}⚠️  Coverage XML not generated${NC}"
    BACKEND_PASS=false
fi

cd ../..

# Frontend Coverage
echo ""
echo "📊 Checking Frontend Coverage (Target: ${FRONTEND_TARGET}%)..."
echo "----------------------------------------"
cd apps/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    npm install
fi

# Check if vitest is available
if ! npm list vitest >/dev/null 2>&1; then
    echo "${YELLOW}⚠️  vitest not found. Installing...${NC}"
    npm install --save-dev vitest @vitest/coverage-v8
fi

# Run coverage
echo "Running frontend tests with coverage..."
npm run test:coverage 2>&1 | tee /tmp/frontend_coverage.log || {
    echo "${YELLOW}⚠️  Frontend tests may have warnings, checking coverage anyway...${NC}"
}

# Extract coverage from coverage-final.json
if [ -f "coverage/coverage-final.json" ]; then
    FRONTEND_COVERAGE=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
let total = 0, covered = 0;
Object.values(data).forEach(file => {
    Object.values(file.s).forEach(count => {
        total++;
        if (count > 0) covered++;
    });
});
const coverage = (covered / total) * 100;
console.log(coverage.toFixed(2));
" 2>/dev/null || echo "0")
    
    if (( $(echo "$FRONTEND_COVERAGE >= $FRONTEND_TARGET" | bc -l) )); then
        echo "${GREEN}✅ Frontend Coverage: ${FRONTEND_COVERAGE}% (Target: ${FRONTEND_TARGET}%)${NC}"
        FRONTEND_PASS=true
    else
        echo "${RED}❌ Frontend Coverage: ${FRONTEND_COVERAGE}% (Target: ${FRONTEND_TARGET}%)${NC}"
        FRONTEND_PASS=false
    fi
else
    # Try to extract from terminal output
    FRONTEND_COVERAGE=$(grep -oP 'All files\s+\|\s+\d+\.\d+' /tmp/frontend_coverage.log 2>/dev/null | tail -1 | awk '{print $NF}' || echo "0")
    if [ "$FRONTEND_COVERAGE" != "0" ]; then
        if (( $(echo "$FRONTEND_COVERAGE >= $FRONTEND_TARGET" | bc -l) )); then
            echo "${GREEN}✅ Frontend Coverage: ${FRONTEND_COVERAGE}% (Target: ${FRONTEND_TARGET}%)${NC}"
            FRONTEND_PASS=true
        else
            echo "${RED}❌ Frontend Coverage: ${FRONTEND_COVERAGE}% (Target: ${FRONTEND_TARGET}%)${NC}"
            FRONTEND_PASS=false
        fi
    else
        echo "${YELLOW}⚠️  Could not determine frontend coverage${NC}"
        FRONTEND_PASS=false
    fi
fi

cd ../..

# Summary
echo ""
echo "=========================================="
echo "Coverage Summary"
echo "=========================================="
echo "Backend:  ${BACKEND_COVERAGE}% (Target: ${BACKEND_TARGET}%)"
echo "Frontend: ${FRONTEND_COVERAGE}% (Target: ${FRONTEND_TARGET}%)"
echo ""

if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ]; then
    echo "${GREEN}✅ All coverage targets met!${NC}"
    exit 0
else
    echo "${RED}❌ Coverage targets not met${NC}"
    exit 1
fi

