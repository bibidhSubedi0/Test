#include <iostream>
#include <string>
#include <vector>
#include <cstring>

// Bug 1: buffer overflow — fixed size buffer, no bounds check on input
void greet(const char* name) {
    char buffer[10];
    strcpy(buffer, name);  // crashes if name > 9 chars
    std::cout << "Hello, " << buffer << std::endl;
}

// Bug 2: memory leak — new[] with no matching delete[]
int* createArray(int size) {
    int* arr = new int[size];
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr;
    // caller is expected to delete[] but this is never documented or enforced
}

// Bug 3: use after free
void useAfterFree() {
    int* ptr = new int(42);
    delete ptr;
    std::cout << *ptr << std::endl;  // undefined behavior
}

// Bug 4: null pointer dereference — no null check before use
void printLength(const char* str) {
    int len = strlen(str);  // crashes if str is nullptr
    std::cout << "Length: " << len << std::endl;
}

// Bug 5: integer overflow — no bounds check before arithmetic
int multiply(int a, int b) {
    return a * b;  // silently overflows for large values
}

// Bug 6: off-by-one error in loop
void printVector(const std::vector<int>& v) {
    for (int i = 0; i <= v.size(); i++) {  // should be <, not <=
        std::cout << v[i] << std::endl;    // out-of-bounds access on last iteration
    }
}

// Bug 7: returning reference to a local variable (dangling reference)
std::string& getLabel() {
    std::string label = "hello";
    return label;  // label is destroyed when function returns
}

// Bug 8: uninitialized variable used in condition
void checkValue() {
    int result;
    if (result > 0) {  // result is uninitialized — undefined behavior
        std::cout << "Positive" << std::endl;
    }
}

// Bug 9: signed/unsigned comparison warning-turned-bug
void processItems(const std::vector<std::string>& items) {
    for (int i = 0; i < items.size(); i++) {  // int vs size_t (unsigned) comparison
        std::cout << items[i] << std::endl;
    }
}

int main() {
    greet("World");

    int* arr = createArray(5);
    // Bug 10: delete instead of delete[] for array
    delete arr;  // should be delete[] arr

    return 0;
}